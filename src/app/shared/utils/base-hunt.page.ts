import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, BehaviorSubject, Subscription } from 'rxjs';
import { IONIC_COMPONENTS } from './ionic.utils';
import {
  AnimatedActionButtonComponent,
  ActionButtonState,
} from '../components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../components/hunt-timer/hunt-timer.component';
import { Hunt, HuntProgress } from '../../models/hunt.model';
import { HuntService } from '../../services/hunt.service';
import { TimerService } from '../../services/timer.service';

export interface HuntPageData {
  currentHunt?: Hunt;
  timer: number;
  isHuntActive: boolean;
  isOverdue: boolean;
}

export interface HuntActionButtonConfig {
  availableStates: string[];
  handlers: Record<string, () => void | Promise<void>>;
  stateConfig: ActionButtonState;
  getCurrentState: () => string;
  isVisible: () => boolean;
}

@Component({
  template: '', // Base component, no template
  standalone: true,
  imports: [
    ...IONIC_COMPONENTS,
    CommonModule,
    FormsModule,
    AnimatedActionButtonComponent,
    HuntTimerComponent,
  ],
})
export abstract class BaseHuntPage implements OnInit, OnDestroy {
  protected huntService = inject(HuntService);
  protected router = inject(Router);
  private timerService = inject(TimerService);

  private destroy$ = new Subject<void>();
  private progressSubscription?: Subscription;
  private timerSubscription?: Subscription;

  huntData: HuntPageData = {
    currentHunt: undefined,
    timer: 0,
    isHuntActive: false,
    isOverdue: false,
  };

  protected taskSpecificConditionMet = new BehaviorSubject<boolean>(false);
  protected taskCompletionTime: number = 0;

  abstract get huntId(): number;

  ngOnInit() {
    this.taskSpecificConditionMet.next(false);
    this.taskCompletionTime = 0;

    this.progressSubscription = this.huntService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe((progress: HuntProgress) => {
        this._updateHuntPageData(progress);
      });

    this.timerSubscription = this.huntService.timer$
      .pipe(takeUntil(this.destroy$))
      .subscribe((timerValue: number | null) => {
        this.huntData.timer = timerValue ?? 0;
        if (this.huntData.currentHunt && this.huntData.isHuntActive) {
          this.huntData.isOverdue =
            !!this.huntData.currentHunt.maxDuration &&
            this.huntData.timer > this.huntData.currentHunt.maxDuration;
        }
      });
  }

  private _updateHuntPageData(progress: HuntProgress): void {
    const hunt = progress.hunts.find(h => h.id === this.huntId);

    if (hunt && (hunt.isSkipped || hunt.isCompleted)) {
      this.router.navigate(['/dashboard']);
      return;
    }

    let isActuallyActive = false;
    let isOverdueForData = false;
    if (hunt) {
      const isCurrentByProgress = progress.currentActiveHunt === this.huntId;
      isActuallyActive = isCurrentByProgress && !!hunt.startTime;
      if (isActuallyActive && hunt.maxDuration) {
        isOverdueForData = this.huntData.timer > hunt.maxDuration;
      }
    }

    this.huntData = {
      currentHunt: hunt,
      timer: this.huntData.timer,
      isHuntActive: isActuallyActive,
      isOverdue: isOverdueForData,
    };
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected get _isCurrentHuntActiveAndModifiable(): boolean {
    const hunt = this.huntData.currentHunt;
    if (!hunt) {
      return false;
    }
    return this.huntData.isHuntActive && !hunt.isCompleted && !hunt.isSkipped;
  }

  get actionButtonConfig(): HuntActionButtonConfig {
    return {
      availableStates: (() => {
        const hunt = this.huntData.currentHunt;
        if (!hunt || !hunt.isUnlocked) return [];
        const states: string[] = [];
        if (this._isCurrentHuntActiveAndModifiable) {
          states.push('skip');
          states.push('complete');
        }
        return states;
      })(),
      handlers: {
        skip: async () => {
          await this.huntService.skipHunt(this.huntId);
        },
        complete: async () => {
          if (this.taskCompletionTime > 0) {
            await this.huntService.completeHunt(
              this.huntId,
              this.taskCompletionTime
            );
          } else {
            await this.huntService.completeHunt(this.huntId);
          }
        },
      },
      stateConfig: AnimatedActionButtonComponent.DEFAULT_STATES,
      getCurrentState: () => {
        const hunt = this.huntData.currentHunt;
        if (!hunt || !hunt.isUnlocked) return '';

        if (this._isCurrentHuntActiveAndModifiable) {
          if (this.taskSpecificConditionMet.value) {
            return 'complete';
          }
          return 'skip';
        }
        return '';
      },
      isVisible: () => {
        const hunt = this.huntData.currentHunt;
        if (!hunt || !hunt.isUnlocked) {
          return false;
        }
        return this._isCurrentHuntActiveAndModifiable;
      },
    };
  }

  protected _onTaskConditionMet(): void {
    if (this.taskSpecificConditionMet.value) return;

    this.taskSpecificConditionMet.next(true);

    if (this.taskCompletionTime === 0) {
      this.taskCompletionTime = this.huntData.timer;
      console.log(
        `Hunt ${this.huntId}: Task condition met at ${this.taskCompletionTime} seconds (recorded in BaseHuntPage)`
      );

      this.huntService.saveHuntDuration(this.huntId, this.taskCompletionTime);
    }
  }

  formatTime(seconds: number): string {
    if (this.taskSpecificConditionMet.value && this.taskCompletionTime > 0) {
      seconds = this.taskCompletionTime;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getHuntStatus(hunt?: Hunt): string {
    const current = hunt || this.huntData.currentHunt;
    if (!current) return 'unknown';
    if (!current.isUnlocked) return 'locked';
    if (current.isCompleted && current.isLateCompletion) return 'late';
    if (current.isCompleted) return 'completed';
    if (current.isSkipped) return 'skipped';
    if (current.startTime && !current.isCompleted) return 'started';
    return 'unlocked';
  }

  get completionTime(): number | null {
    return this.taskSpecificConditionMet.value && this.taskCompletionTime > 0
      ? this.taskCompletionTime
      : null;
  }

  get isTaskConditionMet(): boolean {
    return this.taskSpecificConditionMet.value;
  }
}
