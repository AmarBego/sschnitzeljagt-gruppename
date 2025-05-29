import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
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
            await this.huntService.completeHunt(this.currentHuntId);
          }
        },
      },
      stateConfig: AnimatedActionButtonComponent.DEFAULT_STATES,
      getCurrentState: () => {
        const hunt = this.huntPageData.currentHunt;
        if (!hunt || !hunt.isUnlocked) return '';
        if (this.isCurrentHuntActiveAndModifiable) {
          // Use HuntService for overdue check
          if (
            hunt.id !== undefined &&
            this.huntService.isHuntOverdue(hunt.id)
          ) {
            return 'complete';
          }
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

  // Format timer display
  formatTime(seconds: number): string {
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
