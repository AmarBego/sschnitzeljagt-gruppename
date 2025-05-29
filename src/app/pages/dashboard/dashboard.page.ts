import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../services/user.service';
import { HuntService } from '../../services/hunt.service';
import { AlertService } from '../../services/alert.service';
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
  
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private huntService: HuntService,
    private alertService: AlertService
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
    if (!hunt.isUnlocked || hunt.isCompleted) {
      return;
    }

    if (!hunt.startTime) {
      // Start the hunt
      this.huntService.startHunt(hunt.id);
    } else {
      // For demo purposes, complete the hunt after clicking
      // In real app, this would be triggered by reaching location/scanning QR
      this.huntService.completeHunt(hunt.id);
    }
  }  getHuntButtonColor(hunt: Hunt): string {
    if (hunt.isCompleted) return 'success';
    if (!hunt.isUnlocked) return 'medium';
    if (this.currentActiveHunt === hunt.id) return 'warning';
    return 'light';
  }

  getHuntButtonFill(hunt: Hunt): string {
    if (hunt.isCompleted) return 'solid';
    if (!hunt.isUnlocked) return 'outline';
    if (this.currentActiveHunt === hunt.id) return 'solid';
    return 'outline';
  }

  getHuntDisplayTitle(hunt: Hunt): string {
    if (!hunt.isUnlocked) return '?????';
    return hunt.title;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  async onResetClick(): Promise<void> {
    const shouldReset = await this.alertService.showResetProgressAlert();
    if (shouldReset) {
      this.huntService.resetUserProgress();
    }
  }
}
