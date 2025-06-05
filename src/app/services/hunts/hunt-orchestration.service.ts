// This service orchestrates the lifecycle of hunts.
// It handles actions like starting, completing, and skipping hunts,
// coordinating with validation, progress, timer, and user services.
import { Injectable, inject } from '@angular/core';
import { HuntProgress } from '../../models/hunt.model';
import { HuntProgressService } from './hunt-progress.service';
import { HuntValidationService } from './hunt-validation.service';
import { TimerService } from '../timer.service';
import { UserService } from '../user.service';

@Injectable({
  providedIn: 'root',
})
export class HuntOrchestrationService {
  private readonly huntProgressService = inject(HuntProgressService);
  private readonly huntValidationService = inject(HuntValidationService);
  private readonly timerService = inject(TimerService);
  private readonly userService = inject(UserService);

  startHunt(huntId: number): void {
    this.huntValidationService.validateHuntCanBeStarted(huntId);
    const progress = this.huntProgressService.currentProgress;
    const hunt = this.huntProgressService.findHuntOrFail(huntId);

    hunt.startTime = new Date();
    progress.currentActiveHunt = huntId;

    this.timerService.startTimer(hunt.startTime, huntId);
    this.huntProgressService.updateProgress(progress);
  }

  completeHunt(huntId: number, savedDuration?: number): void {
    this.huntValidationService.validateHuntCanBeCompleted(huntId);
    const progress = this.huntProgressService.currentProgress;
    const hunt = this.huntProgressService.findHuntOrFail(huntId);
    const completionTime = new Date();

    hunt.isCompleted = true;
    hunt.completionTime = completionTime;

    // Use savedDuration if provided, otherwise calculate it
    if (savedDuration !== undefined) {
      hunt.duration = savedDuration;
    } else {
      hunt.duration = hunt.startTime
        ? Math.floor(
            (completionTime.getTime() - new Date(hunt.startTime).getTime()) /
              1000
          )
        : 0;
    }

    if (hunt.maxDuration && hunt.duration > hunt.maxDuration) {
      hunt.isLateCompletion = true;
    }

    progress.totalCompleted++;
    progress.currentActiveHunt = undefined;

    this.unlockNextHuntInternal(progress, huntId);
    this.timerService.stopTimer();
    this.huntProgressService.updateProgress(progress);
  }

  saveHuntDuration(huntId: number, duration: number): void {
    // No need to validate as we're just saving the duration without changing hunt state
    const progress = this.huntProgressService.currentProgress;
    const hunt = this.huntProgressService.findHuntOrFail(huntId);

    // Save the duration without marking the hunt as completed
    hunt.duration = duration;

    // Check if it's a late completion
    if (hunt.maxDuration && duration > hunt.maxDuration) {
      hunt.isLateCompletion = true;
    }

    // Update progress to save the duration
    this.huntProgressService.updateProgress(progress);
  }

  private unlockNextHuntInternal(
    progress: HuntProgress,
    completedHuntId: number
  ): void {
    const nextHunt = progress.hunts.find(h => h.id === completedHuntId + 1);
    if (nextHunt) {
      nextHunt.isUnlocked = true;
    }
  }

  skipHunt(huntId: number, reason: string = 'Manually skipped'): void {
    // No specific validation for skipping apart from hunt existence, which findHuntOrFail covers.
    // If a hunt is already completed or skipped, markHuntAsSkippedInternal handles it gracefully.
    const progress = this.huntProgressService.currentProgress;
    this.markHuntAsSkippedInternal(progress, huntId, reason); // Pass reason
    this.huntProgressService.updateProgress(progress);
  }

  // Renamed to avoid conflict if HuntAppEventsService needs a public version
  // This version assumes progress is already the current one and handles updates itself.
  markHuntAsSkippedInternal(
    progress: HuntProgress, // Takes progress to allow HuntAppEventsService to use it before full update
    huntId: number,
    reason: string
  ): void {
    const hunt = this.huntProgressService.findHuntOrFail(huntId);

    if (!hunt || hunt.isCompleted || hunt.isSkipped) {
      return; // Already processed or doesn't exist
    }

    hunt.isSkipped = true;
    hunt.isCompleted = true;
    hunt.completionTime = new Date(); // Record skip time
    hunt.duration = hunt.startTime
      ? Math.floor(
          (hunt.completionTime.getTime() - new Date(hunt.startTime).getTime()) /
            1000
        )
      : 0;
    // No late completion check for skipped hunts

    progress.currentActiveHunt = undefined;
    this.unlockNextHuntInternal(progress, huntId); // Unlock next even if skipped
    this.timerService.stopTimer();
    // Note: updateProgress is called by the public-facing skipHunt or by HuntAppEventsService
  }

  resetUserProgress(): void {
    this.huntProgressService.resetProgress(); // Resets hunt progress in its own storage
    this.userService.resetCurrentUserProgressAndSession(); // Clears hunt progress from user service perspective and logs out
    this.timerService.stopTimer(); // Ensure timer is stopped
    console.log(
      '[HuntOrchestrationService] User progress and session fully reset.'
    );
  }

  reloadUserProgress(): void {
    // This essentially re-initializes the progress service, which loads from storage.
    // Abandoned hunt checks will be done by HuntAppEventsService during its load process.
    this.huntProgressService.loadProgress();
    const progress = this.huntProgressService.currentProgress;
    if (progress.currentActiveHunt) {
      const activeHunt = this.huntProgressService.findHuntOrFail(
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
    } else {
      this.timerService.stopTimer();
    }
  }
}
