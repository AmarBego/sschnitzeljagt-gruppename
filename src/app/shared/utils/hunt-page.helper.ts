import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, BehaviorSubject } from 'rxjs';
import { HuntService } from '../../services/hunt.service';
import { TimerService } from '../../services/timer.service';
import { Hunt, HuntProgress } from '../../models/hunt.model';
import {
  ActionButtonState,
  AnimatedActionButtonComponent,
} from '../components/animated-action-button/animated-action-button.component';

export interface HuntPageData {
  currentHunt?: Hunt;
  timer: number;
  isHuntActive: boolean;
}

export interface HuntActionButtonConfig {
  availableStates: string[];
  handlers: Record<string, () => void | Promise<void>>;
  stateConfig: ActionButtonState;
  getCurrentState: () => string;
  isVisible: () => boolean;
}

@Injectable()
export class HuntPageHelper implements OnDestroy {
  private readonly huntService = inject(HuntService);
  private readonly timerService = inject(TimerService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // New BehaviorSubject to track if task-specific completion condition is met
  private readonly taskSpecificConditionMet = new BehaviorSubject<boolean>(
    false
  );

  // Add a variable to store the completion time
  private taskCompletionTime: number = 0;

  private currentHuntId?: number;
  private huntPageData: HuntPageData = {
    timer: 0,
    isHuntActive: false,
  };

  constructor() {}

  initializeForHunt(
    huntId: number,
    callback: (data: HuntPageData) => void
  ): void {
    this.currentHuntId = huntId;
    this.taskSpecificConditionMet.next(false); // Reset for the new hunt being initialized
    this.taskCompletionTime = 0; // Reset completion time

    // Subscribe to hunt progress changes
    this.huntService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe((progress: HuntProgress) => {
        this.updateHuntData(progress, callback);
      });

    // Subscribe to timer updates
    this.timerService.timer$
      .pipe(takeUntil(this.destroy$))
      .subscribe((timer: number) => {
        this.huntPageData.timer = timer;
        callback(this.huntPageData);
      });
  }
  private updateHuntData(
    progress: HuntProgress,
    callback: (data: HuntPageData) => void
  ): void {
    const hunt = progress.hunts.find(h => h.id === this.currentHuntId);

    // Check if hunt is skipped or completed and redirect to dashboard
    if (hunt && (hunt.isSkipped || hunt.isCompleted)) {
      this.router.navigate(['/dashboard']);
      return;
    }

    let isActuallyActive = false;
    if (hunt) {
      // If hunt exists and is not skipped/completed (due to the check above),
      // it's active if it's the current one in progress and has a start time.
      const isCurrentByProgress =
        progress.currentActiveHunt === this.currentHuntId;
      isActuallyActive = isCurrentByProgress && !!hunt.startTime;
    }
    // If hunt is undefined (not found), isActuallyActive remains false.

    this.huntPageData = {
      currentHunt: hunt, // hunt itself can be undefined if not found
      timer: this.huntPageData.timer, // Keep existing timer value
      isHuntActive: isActuallyActive,
    };

    callback(this.huntPageData);
  }

  private get isCurrentHuntActiveAndModifiable(): boolean {
    const hunt = this.huntPageData.currentHunt;
    if (!hunt) {
      return false;
    }
    // A hunt is considered active and modifiable if it's the active hunt,
    // and it's not completed or skipped.
    return (
      this.huntPageData.isHuntActive && !hunt.isCompleted && !hunt.isSkipped
    );
  }

  // Get all action button configuration in one consolidated getter
  get actionButtonConfiguration(): HuntActionButtonConfig {
    return {
      availableStates: (() => {
        const hunt = this.huntPageData.currentHunt;
        if (!hunt || !hunt.isUnlocked) return [];
        const states: string[] = [];
        if (this.isCurrentHuntActiveAndModifiable) {
          states.push('skip');
          states.push('complete');
        }
        return states;
      })(),
      handlers: {
        skip: async () => {
          if (this.currentHuntId) {
            await this.huntService.skipHunt(this.currentHuntId);
          }
        },
        complete: async () => {
          if (this.currentHuntId) {
            // If we have a saved completion time, use it when completing the hunt
            if (this.taskCompletionTime > 0) {
              await this.huntService.completeHunt(
                this.currentHuntId,
                this.taskCompletionTime
              );
            } else {
              await this.huntService.completeHunt(this.currentHuntId);
            }
          }
        },
      },
      stateConfig: AnimatedActionButtonComponent.DEFAULT_STATES,
      getCurrentState: () => {
        const hunt = this.huntPageData.currentHunt;
        if (!hunt || !hunt.isUnlocked) return '';

        if (this.isCurrentHuntActiveAndModifiable) {
          if (this.taskSpecificConditionMet.value) {
            // Check our new condition
            return 'complete';
          }
          // If task condition not met, default to 'skip' as per previous change
          return 'skip';
        }
        return '';
      },
      isVisible: () => {
        const hunt = this.huntPageData.currentHunt;
        if (!hunt || !hunt.isUnlocked) {
          return false;
        }
        return this.isCurrentHuntActiveAndModifiable;
      },
    };
  }

  // Public method for hunt pages to set the condition
  setTaskCompletedCondition(isMet: boolean): void {
    this.taskSpecificConditionMet.next(isMet);

    // When the task is completed, store the current timer value
    if (isMet && this.taskCompletionTime === 0) {
      this.taskCompletionTime = this.huntPageData.timer;
      console.log(
        `Hunt ${this.currentHuntId}: Task completed at ${this.taskCompletionTime} seconds`
      );

      // Update the hunt with duration in the service without completing it
      if (this.currentHuntId) {
        this.huntService.saveHuntDuration(
          this.currentHuntId,
          this.taskCompletionTime
        );
      }
    }
  }

  // Format timer display
  formatTime(seconds: number): string {
    // If task is completed, use completion time instead of current timer
    if (this.taskSpecificConditionMet.value && this.taskCompletionTime > 0) {
      seconds = this.taskCompletionTime;
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Get hunt status for display purposes
  getHuntStatus(hunt?: Hunt): string {
    if (!hunt) return 'unknown';
    if (!hunt.isUnlocked) return 'locked';
    if (hunt.isCompleted && hunt.isLateCompletion) return 'late';
    if (hunt.isCompleted) return 'completed';
    if (hunt.isSkipped) return 'skipped';
    // Use HuntService for overdue check if needed for status, though current logic doesn't show 'overdue' as a status
    // For example, if (hunt.id !== undefined && this.huntService.isHuntOverdue(hunt.id) && !hunt.isCompleted) return 'overdue';
    if (hunt.startTime && !hunt.isCompleted) return 'started';
    return 'unlocked';
  }

  // Get remaining time if hunt has a max duration
  getRemainingTime(hunt?: Hunt): number | null {
    if (!hunt || !hunt.maxDuration) return null;
    return Math.max(0, hunt.maxDuration - this.huntPageData.timer);
  }

  // Add getters to expose completion state and time
  get isTaskCompleted(): boolean {
    return this.taskSpecificConditionMet.value;
  }

  get completionTime(): number {
    return this.taskCompletionTime;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
