import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../services/user.service';
import { HuntService } from '../../services/hunt.service';
import { AlertService } from '../../services/alert.service';
import { ModalService } from '../../services/modal.service';
import { Hunt, HuntProgress } from '../../models/hunt.model';
import { IONIC_COMPONENTS } from '../../shared/utils/ionic.utils';
import { HuntNavigationService } from '../../services/hunt-navigation.service'; // Added import
import {
  AnimatedActionButtonComponent,
  ButtonState,
} from '../../shared/components/animated-action-button/animated-action-button.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [CommonModule, ...IONIC_COMPONENTS, AnimatedActionButtonComponent],
})
export class DashboardPage implements OnInit, OnDestroy {
  hunts: Hunt[] = [];
  currentActiveHunt?: number;

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private huntService: HuntService,
    private alertService: AlertService,
    private modalService: ModalService,
    private huntNavigationService: HuntNavigationService // Injected service
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes to reload user-specific progress
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        // User logged in or changed, reload their progress
        this.huntService.reloadUserProgress();
      }
    });

    this.huntService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe((progress: HuntProgress) => {
        this.hunts = progress.hunts;
        this.currentActiveHunt = progress.currentActiveHunt;
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

    if (!hunt.isUnlocked || hunt.isCompleted || hunt.isSkipped) {
      // Prevent interaction with locked, completed, or skipped hunts
      return;
    }

    if (!hunt.startTime) {
      // Start the hunt
      this.huntService.startHunt(hunt.id);
      this.huntNavigationService.navigateToHunt(hunt.id); // Navigate to hunt page
    } else {
      // If hunt is already started, navigate to it (e.g. if user comes back to dashboard)
      this.huntNavigationService.navigateToHunt(hunt.id);
    }
  }

  getHuntStatus(hunt: Hunt): string {
    if (!hunt.isUnlocked) return 'locked';
    if (hunt.isCompleted && hunt.isLateCompletion) return 'late';
    if (hunt.isCompleted) return 'completed';
    if (hunt.isSkipped) return 'skipped';
    if (hunt.startTime && !hunt.isCompleted) return 'started';
    return 'unlocked';
  }

  getHuntDisplayTitle(hunt: Hunt): string {
    if (!hunt.isUnlocked) return '?????';
    return hunt.title;
  }

  onActionPerformed(action: ButtonState): void {
    // Handle any additional logic when button actions are performed
    console.log(`Action performed: ${action}`);
  }

  async onSkipHunt(hunt: Hunt): Promise<void> {
    const shouldSkip = await this.alertService.showSkipHuntAlert(hunt.title);
    if (shouldSkip) {
      this.huntService.skipHunt(hunt.id);
    }
  }

  async onHelpClick(): Promise<void> {
    await this.modalService.showHelpModal();
  }
}
