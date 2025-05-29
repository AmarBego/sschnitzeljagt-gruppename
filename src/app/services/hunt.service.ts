import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HuntProgress } from '../models/hunt.model';
import { HuntProgressService } from './hunts/hunt-progress.service';
import { HuntOrchestrationService } from './hunts/hunt-orchestration.service';
import { HuntAppEventsService } from './hunts/hunt-app-events.service';
import { TimerService } from './timer.service';
// UserService might still be needed if resetUserProgress requires direct interaction here, though likely handled by orchestration.
// INITIAL_HUNTS is no longer needed here, HuntProgressService handles it.

@Injectable({
  providedIn: 'root',
})
export class HuntService {
  private readonly huntProgressService = inject(HuntProgressService);
  private readonly huntOrchestrationService = inject(HuntOrchestrationService);
  private readonly huntAppEventsService = inject(HuntAppEventsService); // Eagerly inject to ensure constructor runs
  private readonly timerService = inject(TimerService);

  // Expose progress and timer observables
  readonly progress$: Observable<HuntProgress> =
    this.huntProgressService.progress$;
  readonly timer$: Observable<number | null> = this.timerService.timer$;

  get currentProgress(): HuntProgress {
    return this.huntProgressService.currentProgress;
  }

  constructor() {
    // The HuntAppEventsService constructor already handles initial on-load checks.
    // Other services are initialized via inject().
  }

  // --- Hunt Lifecycle Actions (delegated to HuntOrchestrationService) ---
  startHunt(huntId: number): void {
    this.huntOrchestrationService.startHunt(huntId);
  }

  completeHunt(huntId: number): void {
    this.huntOrchestrationService.completeHunt(huntId);
  }

  skipHunt(huntId: number): void {
    this.huntOrchestrationService.skipHunt(huntId);
  }

  // --- Progress Management (delegated) ---
  resetProgress(): void {
    // Typically, components might call resetUserProgress for a full reset.
    // If a simple progress reset (without user data) is needed, it's available.
    this.huntProgressService.resetProgress();
    this.timerService.stopTimer(); // Ensure timer is stopped on simple reset too.
  }

  resetUserProgress(): void {
    this.huntOrchestrationService.resetUserProgress();
  }

  reloadUserProgress(): void {
    this.huntOrchestrationService.reloadUserProgress();
    // Post-reload, HuntAppEventsService and HuntOrchestrationService handle timer resumption logic.
  }

  // --- App Lifecycle Event Handling (delegated to HuntAppEventsService) ---
  handleAppBackground(): void {
    this.huntAppEventsService.handleAppBackground();
  }

  handleAppForeground(timeAwayMs: number): void {
    this.huntAppEventsService.handleAppForeground(timeAwayMs);
  }

  handleAppClose(): void {
    this.huntAppEventsService.handleAppClose();
  }

  // --- Queries ---
  getHuntMaxDuration(huntId: number): number | undefined {
    return this.huntProgressService.getHuntMaxDuration(huntId);
  }

  isHuntOverdue(huntId: number): boolean {
    const hunt = this.huntProgressService.findHuntOrFail(huntId);
    if (!hunt || !hunt.startTime || !hunt.maxDuration) {
      return false;
    }
    // currentElapsedTime should ideally come from timerService directly if it's simple enough
    // or through a method that gives the current time for a specific hunt if logic is complex.
    const elapsedTime = this.timerService.currentElapsedTime; // Assuming TimerService exposes this
    return elapsedTime > hunt.maxDuration;
  }
}
