import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HuntService } from '../../services/hunt.service';
import { TimerService } from '../../services/timer.service';
import { Hunt, HuntProgress } from '../../models/hunt.model';
import { ButtonState } from '../components/animated-action-button/animated-action-button.component';

export interface HuntPageData {
  currentHunt?: Hunt;
  timer: number;
  isHuntActive: boolean;
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
    const isActiveHunt = progress.currentActiveHunt === this.currentHuntId; // Check if hunt is skipped or completed and redirect to dashboard
    if (hunt && (hunt.isSkipped || hunt.isCompleted)) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.huntPageData = {
      currentHunt: hunt,
      timer: this.huntPageData.timer, // Keep existing timer value
      isHuntActive:
        isActiveHunt &&
        !!hunt?.startTime &&
        !hunt.isCompleted &&
        !hunt.isSkipped,
    };

    callback(this.huntPageData);
  }
  // ndle action performed by the animated action button

  onActionPerformed(action: ButtonState): void {
    // The animated action button component already handles the core logic
    // This method can be extended for hunt-specific actions if needed
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
    if (hunt.startTime && !hunt.isCompleted) return 'started';
    return 'unlocked';
  }

  // Check if hunt has exceeded its maximum duration
  isHuntOverdue(hunt?: Hunt): boolean {
    if (!hunt || !hunt.maxDuration || !hunt.startTime) return false;
    return this.huntPageData.timer > hunt.maxDuration;
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
