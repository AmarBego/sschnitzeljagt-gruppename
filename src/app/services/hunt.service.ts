import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Hunt, HuntProgress } from '../models/hunt.model';
import { UserService } from './user.service';
import { TimerService } from './timer.service';

@Injectable({
  providedIn: 'root'
})
export class HuntService {
  private readonly STORAGE_KEY = 'hunt_progress';
  private readonly ABANDONMENT_THRESHOLD = 30000; // 30 seconds to consider abandoned
  private readonly progressSubject = new BehaviorSubject<HuntProgress>(this.getInitialProgress());
  
  private readonly userService = inject(UserService);
  private readonly timerService = inject(TimerService);

  constructor() {
    this.loadProgress();
  }
  readonly progress$ = this.progressSubject.asObservable();
  readonly timer$ = this.timerService.timer$;

  get currentProgress(): HuntProgress {
    return this.progressSubject.value;
  }

  startHunt(huntId: number): void {
    const progress = this.currentProgress;
    const validationResult = this.validateHuntStart(progress, huntId);
    
    if (!validationResult.isValid) {
      throw new Error(validationResult.error!);
    }    const hunt = validationResult.hunt!;
    hunt.startTime = new Date();
    progress.currentActiveHunt = huntId;

    this.timerService.startTimer(hunt.startTime, huntId);
    this.updateProgress(progress);
  }

  private validateHuntStart(progress: HuntProgress, huntId: number) {
    if (progress.currentActiveHunt !== undefined && progress.currentActiveHunt !== huntId) {
      const activeHuntDetails = progress.hunts.find(h => h.id === progress.currentActiveHunt);
      return { 
        isValid: false, 
        error: `Cannot start Hunt ID ${huntId}. Hunt '${activeHuntDetails?.title || progress.currentActiveHunt}' is already in progress.` 
      };
    }

    const hunt = progress.hunts.find(h => h.id === huntId);
    if (!hunt) {
      return { 
        isValid: false, 
        error: `HuntService: Hunt with ID ${huntId} not found.` 
      };
    }

    if (!hunt.isUnlocked) {
      return { 
        isValid: false, 
        error: `HuntService: Hunt '${hunt.title}' (ID ${huntId}) is locked and cannot be started.` 
      };
    }

    if (hunt.isCompleted) {
      return { 
        isValid: false, 
        error: `HuntService: Hunt '${hunt.title}' (ID ${huntId}) is already completed.` 
      };
    }

    return { isValid: true, hunt };
  }  completeHunt(huntId: number): void {
    const progress = this.currentProgress;
    const validationResult = this.validateHuntCompletion(progress, huntId);
    
    if (!validationResult.isValid) {
      throw new Error(validationResult.error!);
    }

    const hunt = validationResult.hunt!;
    const completionTime = new Date();
    
    hunt.isCompleted = true;
    hunt.completionTime = completionTime;
    hunt.duration = hunt.startTime ? 
      Math.floor((completionTime.getTime() - hunt.startTime.getTime()) / 1000) : 0;

    // Check if completion is late (exceeds maximum duration)
    if (hunt.maxDuration && hunt.duration > hunt.maxDuration) {
      hunt.isLateCompletion = true;
    }

    progress.totalCompleted++;
    progress.currentActiveHunt = undefined;

    this.unlockNextHunt(progress, huntId);
    this.timerService.stopTimer();
    this.updateProgress(progress);
  }

  private validateHuntCompletion(progress: HuntProgress, huntId: number) {
    const hunt = progress.hunts.find(h => h.id === huntId);
    if (!hunt) {
      return { 
        isValid: false, 
        error: `HuntService: Hunt with ID ${huntId} not found.` 
      };
    }

    if (progress.currentActiveHunt !== huntId) {
      return { 
        isValid: false, 
        error: `HuntService: Cannot complete Hunt '${hunt.title}' (ID ${huntId}). It is not the currently active hunt.` 
      };
    }

    if (hunt.isCompleted) {
      return { 
        isValid: false, 
        error: `HuntService: Hunt '${hunt.title}' (ID ${huntId}) is already completed.` 
      };
    }

    if (!hunt.startTime) {
      return { 
        isValid: false, 
        error: `HuntService: Cannot complete Hunt '${hunt.title}' (ID ${huntId}). Start time is missing.` 
      };
    }

    return { isValid: true, hunt };
  }

  private unlockNextHunt(progress: HuntProgress, huntId: number): void {
    const nextHunt = progress.hunts.find(h => h.id === huntId + 1);
    if (nextHunt) {
      nextHunt.isUnlocked = true;
    }
  }
  resetProgress(): void {
    const initialProgress = this.getInitialProgress();
    this.updateProgress(initialProgress);
    this.timerService.stopTimer();
  }

  resetUserProgress(): void {
    // Reset hunt progress
    const initialProgress = this.getInitialProgress();
    this.updateProgress(initialProgress);
    this.timerService.stopTimer();
    
    // Clear user-specific data
    this.userService.clearUserData();
  }

  reloadUserProgress(): void {
    // Reset to initial state first
    this.progressSubject.next(this.getInitialProgress());
    this.timerService.stopTimer();
    
    // Then load user-specific progress
    this.loadProgress();
  }  private loadProgress(): void {
    const storageKey = this.userService.getUserStorageKey(this.STORAGE_KEY);
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) return;

    try {
      const progress = JSON.parse(stored);
      
      // Check for abandoned hunts on app restart
      this.checkForAbandonedHunt(progress);
      
      this.progressSubject.next(progress);
      this.resumeActiveHuntTimer(progress);
    } catch (error) {
      console.error('Failed to load hunt progress:', error);
    }
  }

  private checkForAbandonedHunt(progress: HuntProgress): void {
    const backgroundTimeStr = localStorage.getItem('app_background_time');
    
    if (progress.currentActiveHunt && backgroundTimeStr) {
      try {
        const backgroundTime = new Date(backgroundTimeStr);
        const currentTime = new Date();
        const timeAway = currentTime.getTime() - backgroundTime.getTime();
        
        // If app was away for more than threshold, mark hunt as abandoned
        if (timeAway > this.ABANDONMENT_THRESHOLD) {
          this.markHuntAsSkipped(progress.currentActiveHunt, `App was away for ${Math.round(timeAway / 1000)} seconds`);
        }
      } catch (error) {
        console.error('Error checking abandoned hunt:', error);
      }
      
      localStorage.removeItem('app_background_time');
    }
  }
  private resumeActiveHuntTimer(progress: HuntProgress): void {
    if (!progress.currentActiveHunt) return;

    const activeHunt = progress.hunts.find(h => h.id === progress.currentActiveHunt);
    if (activeHunt?.startTime && !activeHunt.isCompleted) {
      this.timerService.startTimer(new Date(activeHunt.startTime), activeHunt.id);
    }
  }
  private getInitialProgress(): HuntProgress {
    return {
      hunts: [
        { id: 1, title: 'First Discovery', description: 'Find your first clue', isCompleted: false, isUnlocked: true, maxDuration: 300 }, // 5 minutes
        { id: 2, title: 'Hidden Path', description: 'Follow the hidden trail', isCompleted: false, isUnlocked: false, maxDuration: 450 }, // 7.5 minutes
        { id: 3, title: 'Secret Location', description: 'Discover the secret spot', isCompleted: false, isUnlocked: false, maxDuration: 600 }, // 10 minutes
        { id: 4, title: 'Ancient Marker', description: 'Find the ancient marker', isCompleted: false, isUnlocked: false, maxDuration: 360 }, // 6 minutes
        { id: 5, title: 'Final Treasure', description: 'Locate the final treasure', isCompleted: false, isUnlocked: false, maxDuration: 540 }, // 9 minutes
        { id: 6, title: 'Ultimate Prize', description: 'Claim your ultimate prize', isCompleted: false, isUnlocked: false, maxDuration: 420 } // 7 minutes
      ],
      totalCompleted: 0
    };
  }

  private updateProgress(progress: HuntProgress): void {
    const storageKey = this.userService.getUserStorageKey(this.STORAGE_KEY);
    localStorage.setItem(storageKey, JSON.stringify(progress));
    this.progressSubject.next(progress);
  }

  handleAppBackground(): void {
    // Save the time when app goes to background if there's an active hunt
    const progress = this.currentProgress;
    if (progress.currentActiveHunt) {
      localStorage.setItem('app_background_time', new Date().toISOString());
    }
  }

  handleAppForeground(timeAway: number): void {
    // Check if the hunt should be marked as abandoned when app comes back
    const progress = this.currentProgress;
    if (progress.currentActiveHunt && timeAway > this.ABANDONMENT_THRESHOLD) {
      this.markHuntAsSkipped(progress.currentActiveHunt, 'App was closed/minimized too long');
    }
    localStorage.removeItem('app_background_time');
  }

  handleAppClose(): void {
    // Immediately mark active hunt as skipped when app is being closed
    const progress = this.currentProgress;
    if (progress.currentActiveHunt) {
      this.markHuntAsSkipped(progress.currentActiveHunt, 'App was closed');
    }
  }

  private markHuntAsSkipped(huntId: number, reason: string): void {
    const progress = this.currentProgress;
    const hunt = progress.hunts.find(h => h.id === huntId);
    
    if (!hunt || hunt.isCompleted || hunt.isSkipped) {
      return;
    }

    console.log(`Marking hunt ${huntId} as skipped: ${reason}`);
    
    hunt.isSkipped = true;
    hunt.completionTime = new Date();
    hunt.duration = hunt.startTime ? 
      Math.floor((hunt.completionTime.getTime() - hunt.startTime.getTime()) / 1000) : 0;

    progress.currentActiveHunt = undefined;
    
    // Unlock next hunt even if this one was skipped
    this.unlockNextHunt(progress, huntId);
    this.timerService.stopTimer();
    this.updateProgress(progress);
  }
  skipHunt(huntId: number): void {
    this.markHuntAsSkipped(huntId, 'Manually skipped');
  }

  getHuntMaxDuration(huntId: number): number | undefined {
    const hunt = this.currentProgress.hunts.find(h => h.id === huntId);
    return hunt?.maxDuration;
  }

  isHuntOverdue(huntId: number): boolean {
    const hunt = this.currentProgress.hunts.find(h => h.id === huntId);
    if (!hunt || !hunt.startTime || !hunt.maxDuration) {
      return false;
    }

    const elapsedTime = this.timerService.currentElapsedTime;
    return elapsedTime > hunt.maxDuration;
  }
}
