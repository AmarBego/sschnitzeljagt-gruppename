import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Hunt, HuntProgress } from '../models/hunt.model';
import { UserService } from './user.service';
import { TimerService } from './timer.service';
import { INITIAL_HUNTS } from '../data/hunt.data';

@Injectable({
  providedIn: 'root',
})
export class HuntService {
  private readonly STORAGE_KEY = 'hunt_progress';
  private readonly ABANDONMENT_THRESHOLD = 3000; // 3 seconds to consider abandoned (for testing)
  private readonly progressSubject = new BehaviorSubject<HuntProgress>(
    this.getInitialProgress()
  );

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
    this.validateHuntCanBeStarted(progress, huntId);

    const hunt = this.findHuntOrFail(progress, huntId);
    hunt.startTime = new Date();
    progress.currentActiveHunt = huntId;

    this.timerService.startTimer(hunt.startTime, huntId);
    this.updateProgress(progress);
  }

  private validateHuntCanBeStarted(
    progress: HuntProgress,
    huntId: number
  ): void {
    this.ensureHuntIsNotAlreadyActive(progress, huntId);
    const hunt = this.findHuntOrFail(progress, huntId);
    this.ensureHuntIsUnlocked(hunt);
    this.ensureHuntIsNotCompleted(hunt);
  }

  private ensureHuntIsNotAlreadyActive(
    progress: HuntProgress,
    huntId: number
  ): void {
    if (
      progress.currentActiveHunt !== undefined &&
      progress.currentActiveHunt !== huntId
    ) {
      const activeHuntDetails = this.findHuntOrFail(
        progress,
        progress.currentActiveHunt
      );
      throw new Error(
        `Cannot start Hunt ID ${huntId}. Hunt '${activeHuntDetails?.title || progress.currentActiveHunt}' is already in progress.`
      );
    }
  }

  private findHuntOrFail(progress: HuntProgress, huntId: number): Hunt {
    const hunt = progress.hunts.find(h => h.id === huntId);
    if (!hunt) {
      throw new Error(`HuntService: Hunt with ID ${huntId} not found.`);
    }
    return hunt;
  }

  private ensureHuntIsUnlocked(hunt: Hunt): void {
    if (!hunt.isUnlocked) {
      throw new Error(
        `HuntService: Hunt '${hunt.title}' (ID ${hunt.id}) is locked and cannot be started.`
      );
    }
  }

  private ensureHuntIsNotCompleted(hunt: Hunt): void {
    if (hunt.isCompleted) {
      throw new Error(
        `HuntService: Hunt '${hunt.title}' (ID ${hunt.id}) is already completed.`
      );
    }
  }

  completeHunt(huntId: number): void {
    const progress = this.currentProgress;
    this.validateHuntCanBeCompleted(progress, huntId);

    const hunt = this.findHuntOrFail(progress, huntId);
    const completionTime = new Date();

    hunt.isCompleted = true;
    hunt.completionTime = completionTime;
    hunt.duration = hunt.startTime
      ? Math.floor(
          (completionTime.getTime() - new Date(hunt.startTime).getTime()) / 1000
        )
      : 0;

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

  private validateHuntCanBeCompleted(
    progress: HuntProgress,
    huntId: number
  ): void {
    const hunt = this.findHuntOrFail(progress, huntId);
    this.ensureHuntIsActive(progress, hunt);
    this.ensureHuntIsNotCompleted(hunt);
    this.ensureHuntHasStartTime(hunt);
  }

  private ensureHuntIsActive(progress: HuntProgress, hunt: Hunt): void {
    if (progress.currentActiveHunt !== hunt.id) {
      throw new Error(
        `HuntService: Cannot complete Hunt '${hunt.title}' (ID ${hunt.id}). It is not the currently active hunt.`
      );
    }
  }

  private ensureHuntHasStartTime(hunt: Hunt): void {
    if (!hunt.startTime) {
      throw new Error(
        `HuntService: Cannot complete Hunt '${hunt.title}' (ID ${hunt.id}). Start time is missing.`
      );
    }
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
    this.resetProgress();

    // Clear user-specific data
    this.userService.clearUserData();
  }

  reloadUserProgress(): void {
    // Reset to initial state first
    this.progressSubject.next(this.getInitialProgress());
    this.timerService.stopTimer();

    // Then load user-specific progress
    this.loadProgress();
  }
  private loadProgress(): void {
    const storageKey = this.userService.getUserStorageKey(this.STORAGE_KEY);
    const stored = localStorage.getItem(storageKey);

    if (!stored) return;

    try {
      const progress = JSON.parse(stored);

      // Check for abandoned hunts on app restart
      this.checkForAbandonedHuntOnLoad(progress);

      this.progressSubject.next(progress);
      this.resumeActiveHuntTimer(progress);
    } catch (error) {
      console.error('Failed to load hunt progress:', error);
    }
  }

  private checkForAbandonedHuntOnLoad(progress: HuntProgress): void {
    const backgroundTimeStr = localStorage.getItem('app_background_time');

    if (progress.currentActiveHunt && backgroundTimeStr) {
      try {
        const backgroundTime = new Date(backgroundTimeStr);
        const currentTime = new Date();
        const timeAwayMs = currentTime.getTime() - backgroundTime.getTime();
        this._processAbandonment(progress, timeAwayMs, 'onAppLoad');
      } catch (error) {
        console.error('Error checking abandoned hunt on load:', error);
      } finally {
        localStorage.removeItem('app_background_time');
      }
    }
  }

  private _processAbandonment(
    progress: HuntProgress,
    timeAwayMs: number,
    source: 'onAppLoad' | 'onForeground'
  ): void {
    if (
      !progress.currentActiveHunt ||
      timeAwayMs <= this.ABANDONMENT_THRESHOLD
    ) {
      return;
    }

    try {
      const activeHunt = this.findHuntOrFail(
        progress,
        progress.currentActiveHunt
      );
      if (activeHunt && !activeHunt.isCompleted && !activeHunt.isSkipped) {
        this.markHuntAsSkippedInternal(
          progress,
          activeHunt.id,
          `App was away for ${Math.round(timeAwayMs / 1000)} seconds (detected ${source})`
        );
        this.updateProgress(progress);
      }
    } catch (error) {
      console.error(
        `Error processing abandonment for hunt ID ${progress.currentActiveHunt} from ${source}:`,
        error
      );
    }
  }

  private resumeActiveHuntTimer(progress: HuntProgress): void {
    if (!progress.currentActiveHunt) return;

    const activeHunt = this.findHuntOrFail(
      progress,
      progress.currentActiveHunt
    );
    if (
      activeHunt?.startTime &&
      !activeHunt.isCompleted &&
      !activeHunt.isSkipped
    ) {
      this.timerService.startTimer(
        new Date(activeHunt.startTime),
        activeHunt.id
      );
    }
  }
  private getInitialProgress(): HuntProgress {
    return {
      hunts: JSON.parse(JSON.stringify(INITIAL_HUNTS)), // Deep copy to avoid modifying the original data
      totalCompleted: 0,
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

  handleAppForeground(timeAwayMs: number): void {
    const progress = this.currentProgress;
    this._processAbandonment(progress, timeAwayMs, 'onForeground');
    localStorage.removeItem('app_background_time');
  }

  handleAppClose(): void {
    // Immediately mark active hunt as skipped when app is being closed
    const progress = this.currentProgress;
    if (progress.currentActiveHunt) {
      this.markHuntAsSkipped(progress.currentActiveHunt, 'App was closed');
    }
  }

  private markHuntAsSkippedInternal(
    progress: HuntProgress,
    huntId: number,
    reason: string
  ): void {
    const hunt = this.findHuntOrFail(progress, huntId);

    if (!hunt || hunt.isCompleted || hunt.isSkipped) {
      return;
    }

    hunt.isSkipped = true;
    hunt.completionTime = new Date();
    hunt.duration = hunt.startTime
      ? Math.floor(
          (hunt.completionTime.getTime() - new Date(hunt.startTime).getTime()) /
            1000
        )
      : 0;

    progress.currentActiveHunt = undefined;

    // Unlock next hunt even if this one was skipped
    this.unlockNextHunt(progress, huntId);
    this.timerService.stopTimer();
  }

  private markHuntAsSkipped(huntId: number, reason: string): void {
    const progress = this.currentProgress;
    this.markHuntAsSkippedInternal(progress, huntId, reason);
    this.updateProgress(progress);
  }
  skipHunt(huntId: number): void {
    this.markHuntAsSkipped(huntId, 'Manually skipped');
  }

  getHuntMaxDuration(huntId: number): number | undefined {
    const hunt = this.findHuntOrFail(this.currentProgress, huntId);
    return hunt?.maxDuration;
  }

  isHuntOverdue(huntId: number): boolean {
    const hunt = this.findHuntOrFail(this.currentProgress, huntId);
    if (!hunt || !hunt.startTime || !hunt.maxDuration) {
      return false;
    }

    const elapsedTime = this.timerService.currentElapsedTime;
    return elapsedTime > hunt.maxDuration;
  }
}
