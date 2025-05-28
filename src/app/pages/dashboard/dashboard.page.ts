import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../services/user.service';
import { HuntService } from '../../services/hunt.service';
import { AlertService } from '../../services/alert.service';
import { ModalService } from '../../services/modal.service';
import { Hunt, HuntProgress } from '../../models/hunt.model';
import { IONIC_COMPONENTS } from '../../shared/ionic.utils';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    CommonModule,
    ...IONIC_COMPONENTS
  ]
})
export class DashboardPage implements OnInit, OnDestroy {
  hunts: Hunt[] = [];
  currentTimer = 0;
  currentActiveHunt?: number;
  
  private destroy$ = new Subject<void>();  constructor(
    private userService: UserService,
    private huntService: HuntService,
    private alertService: AlertService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes to reload user-specific progress
    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          // User logged in or changed, reload their progress
          this.huntService.reloadUserProgress();
        }
      });    this.huntService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe((progress: HuntProgress) => {
        this.hunts = progress.hunts;
        this.currentActiveHunt = progress.currentActiveHunt;
      });

    this.huntService.timer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(time => {
        this.currentTimer = time;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  onHuntClick(hunt: Hunt): void {
    if (!hunt || typeof hunt.id !== 'number') {
      console.error('Invalid hunt object provided to onHuntClick');
      return;
    }

    if (!hunt.isUnlocked || hunt.isCompleted) {
      // Optionally, provide user feedback here e.g., via a toast message
      return;
    }

    // It's good practice to ensure currentActiveHunt is managed correctly
    // although huntService should already handle this.
    // Consider if any local state needs to be guarded before these calls.

    if (!hunt.startTime) {
      // Start the hunt
      // No explicit await needed if huntService.startHunt is synchronous
      // and doesn't return a Promise. If it were async, you'd use:
      // await this.huntService.startHunt(hunt.id);
      this.huntService.startHunt(hunt.id);
    } else {
      // For demo purposes, complete the hunt after clicking
      // In real app, this would be triggered by reaching location/scanning QR
      // Similar to startHunt, await if it were an async operation.
      this.huntService.completeHunt(hunt.id);
    }
  }
  getHuntStatus(hunt: Hunt): string {
    if (!hunt.isUnlocked) return 'locked';
    if (hunt.isCompleted && hunt.isLateCompletion) return 'late';
    if (hunt.isCompleted) return 'completed';
    if (hunt.isSkipped) return 'skipped';
    if (this.currentActiveHunt === hunt.id) return 'active';
    if (hunt.startTime && !hunt.isCompleted) return 'started';
    return 'unlocked';
  }

  getHuntDisplayTitle(hunt: Hunt): string {
    if (!hunt.isUnlocked) return '?????';
    return hunt.title;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }  async onResetClick(): Promise<void> {
    const shouldReset = await this.alertService.showResetProgressAlert();
    if (shouldReset) {
      // Assuming resetUserProgress is synchronous or its completion
      // doesn't need to be awaited for subsequent UI updates here.
      // If it involved async operations that DashboardPage depends on immediately,
      // it should return a Promise and be awaited.
      this.huntService.resetUserProgress();
      // Potentially reload or update local component state if necessary after reset
    }
  }  async onHelpClick(): Promise<void> {
    await this.modalService.showHelpModal();
  }
}
