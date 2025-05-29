// This service is responsible for all validation logic related to hunts.
// It ensures that hunts can only be started or completed if certain conditions are met,
// such as the hunt being unlocked, not already active, or having a start time.
import { Injectable, inject } from '@angular/core';
import { Hunt, HuntProgress } from '../../models/hunt.model';
import { HuntProgressService } from './hunt-progress.service';

@Injectable({
  providedIn: 'root',
})
export class HuntValidationService {
  private readonly huntProgressService = inject(HuntProgressService);

  // Helper to access huntProgressService.findHuntOrFail with a clearer name in this context
  private findHuntOrFail(huntId: number): Hunt {
    return this.huntProgressService.findHuntOrFail(huntId);
  }

  validateHuntCanBeStarted(huntId: number): void {
    const progress = this.huntProgressService.currentProgress;
    this.ensureHuntIsNotAlreadyActive(progress, huntId);
    const hunt = this.findHuntOrFail(huntId);
    this.ensureHuntIsUnlocked(hunt);
    this.ensureHuntIsNotCompleted(hunt);
  }

  ensureHuntIsNotAlreadyActive(progress: HuntProgress, huntId: number): void {
    if (
      progress.currentActiveHunt !== undefined &&
      progress.currentActiveHunt !== huntId
    ) {
      const activeHuntDetails = this.findHuntOrFail(progress.currentActiveHunt);
      throw new Error(
        `HuntValidationService: Cannot start Hunt ID ${huntId}. Hunt '${activeHuntDetails?.title || progress.currentActiveHunt}' is already in progress.`
      );
    }
  }

  ensureHuntIsUnlocked(hunt: Hunt): void {
    if (!hunt.isUnlocked) {
      throw new Error(
        `HuntValidationService: Hunt '${hunt.title}' (ID ${hunt.id}) is locked and cannot be started.`
      );
    }
  }

  ensureHuntIsNotCompleted(hunt: Hunt): void {
    if (hunt.isCompleted) {
      throw new Error(
        `HuntValidationService: Hunt '${hunt.title}' (ID ${hunt.id}) is already completed.`
      );
    }
  }

  validateHuntCanBeCompleted(huntId: number): void {
    const progress = this.huntProgressService.currentProgress;
    const hunt = this.findHuntOrFail(huntId);
    this.ensureHuntIsActive(progress, hunt);
    this.ensureHuntIsNotCompleted(hunt); // Re-use existing validation
    this.ensureHuntHasStartTime(hunt);
  }

  ensureHuntIsActive(progress: HuntProgress, hunt: Hunt): void {
    if (progress.currentActiveHunt !== hunt.id) {
      throw new Error(
        `HuntValidationService: Cannot complete Hunt '${hunt.title}' (ID ${hunt.id}). It is not the currently active hunt.`
      );
    }
  }

  ensureHuntHasStartTime(hunt: Hunt): void {
    if (!hunt.startTime) {
      throw new Error(
        `HuntValidationService: Cannot complete Hunt '${hunt.title}' (ID ${hunt.id}). Start time is missing.`
      );
    }
  }
}
