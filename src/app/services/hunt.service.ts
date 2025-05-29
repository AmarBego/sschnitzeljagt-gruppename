import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { Hunt, HuntProgress } from '../models/hunt.model';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class HuntService {
  private readonly STORAGE_KEY = 'hunt_progress';
  private progressSubject = new BehaviorSubject<HuntProgress>(this.getInitialProgress());
  private timerSubject = new BehaviorSubject<number>(0);
  private timerSubscription?: Subscription;
  private activeHuntStartTime?: Date;

  constructor(private userService: UserService) {
    this.loadProgress();
  }

  get progress$(): Observable<HuntProgress> {
    return this.progressSubject.asObservable();
  }

  get timer$(): Observable<number> {
    return this.timerSubject.asObservable();
  }

  get currentProgress(): HuntProgress {
    return this.progressSubject.value;
  }

  startHunt(huntId: number): void {
    const progress = this.currentProgress;
    const hunt = progress.hunts.find(h => h.id === huntId);
    
    if (!hunt || !hunt.isUnlocked || hunt.isCompleted) {
      return;
    }

    // Start timer
    this.activeHuntStartTime = new Date();
    hunt.startTime = this.activeHuntStartTime;
    progress.currentActiveHunt = huntId;

    this.startTimer();
    this.updateProgress(progress);
  }

  completeHunt(huntId: number): void {
    const progress = this.currentProgress;
    const hunt = progress.hunts.find(h => h.id === huntId);
    
    if (!hunt || hunt.isCompleted) {
      return;
    }

    // Complete current hunt
    hunt.isCompleted = true;
    hunt.completionTime = new Date();
    
    if (hunt.startTime) {
      hunt.duration = Math.floor((hunt.completionTime.getTime() - hunt.startTime.getTime()) / 1000);
    }

    progress.totalCompleted++;
    progress.currentActiveHunt = undefined;

    // Unlock next hunt
    const nextHunt = progress.hunts.find(h => h.id === huntId + 1);
    if (nextHunt) {
      nextHunt.isUnlocked = true;
    }

    this.stopTimer();
    this.updateProgress(progress);
  }

  resetProgress(): void {
    const initialProgress = this.getInitialProgress();
    this.updateProgress(initialProgress);
    this.stopTimer();
  }

  resetUserProgress(): void {
    // Reset hunt progress
    const initialProgress = this.getInitialProgress();
    this.updateProgress(initialProgress);
    this.stopTimer();
    
    // Clear user-specific data
    this.userService.clearUserData();
  }

  reloadUserProgress(): void {
    // Reset to initial state first
    this.progressSubject.next(this.getInitialProgress());
    this.stopTimer();
    
    // Then load user-specific progress
    this.loadProgress();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.activeHuntStartTime) {
        const elapsed = Math.floor((new Date().getTime() - this.activeHuntStartTime.getTime()) / 1000);
        this.timerSubject.next(elapsed);
      }
    });
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
    this.timerSubject.next(0);
    this.activeHuntStartTime = undefined;
  }

  private getInitialProgress(): HuntProgress {
    return {
      hunts: [
        { id: 1, title: 'First Discovery', description: 'Find your first clue', isCompleted: false, isUnlocked: true },
        { id: 2, title: 'Hidden Path', description: 'Follow the hidden trail', isCompleted: false, isUnlocked: false },
        { id: 3, title: 'Secret Location', description: 'Discover the secret spot', isCompleted: false, isUnlocked: false },
        { id: 4, title: 'Ancient Marker', description: 'Find the ancient marker', isCompleted: false, isUnlocked: false },
        { id: 5, title: 'Final Treasure', description: 'Locate the final treasure', isCompleted: false, isUnlocked: false },
        { id: 6, title: 'Ultimate Prize', description: 'Claim your ultimate prize', isCompleted: false, isUnlocked: false }
      ],
      totalCompleted: 0
    };
  }
  private updateProgress(progress: HuntProgress): void {
    const storageKey = this.userService.getUserStorageKey(this.STORAGE_KEY);
    localStorage.setItem(storageKey, JSON.stringify(progress));
    this.progressSubject.next(progress);
  }
  private loadProgress(): void {
    const storageKey = this.userService.getUserStorageKey(this.STORAGE_KEY);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const progress = JSON.parse(stored);
        this.progressSubject.next(progress);
        
        // Resume timer if there's an active hunt
        if (progress.currentActiveHunt) {
          const activeHunt = progress.hunts.find((h: Hunt) => h.id === progress.currentActiveHunt);
          if (activeHunt?.startTime && !activeHunt.isCompleted) {
            this.activeHuntStartTime = new Date(activeHunt.startTime);
            this.startTimer();
          }
        }
      } catch (error) {
        console.error('Failed to load hunt progress:', error);
      }
    }
  }
}
