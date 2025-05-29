import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../services/user.service';
import { HuntService } from '../../services/hunt.service';
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
  
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private huntService: HuntService
  ) {}

  ngOnInit(): void {
    this.huntService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe((progress: HuntProgress) => {
        this.hunts = progress.hunts;
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
  }

  getHuntButtonColor(hunt: Hunt): string {
    if (hunt.isCompleted) return 'success';
    if (!hunt.isUnlocked) return 'medium';
    return 'primary';
  }

  getHuntButtonFill(hunt: Hunt): string {
    if (hunt.isCompleted) return 'solid';
    if (!hunt.isUnlocked) return 'outline';
    return 'solid';
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
}
