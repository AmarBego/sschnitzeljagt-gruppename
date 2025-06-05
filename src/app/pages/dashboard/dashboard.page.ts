import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../services/user.service';
import { HuntService } from '../../services/hunt.service';
import { AlertService } from '../../services/alert.service';
import { ModalService } from '../../services/modal.service';
import { Hunt, HuntProgress } from '../../models/hunt.model';
import { IONIC_COMPONENTS } from '../../shared/utils/ionic.utils';
import { HuntNavigationService } from '../../services/hunts/hunt-navigation.service'; // Added import
import {
  AnimatedActionButtonComponent,
  ActionButtonState,
} from '../../shared/components/animated-action-button/animated-action-button.component';
import { ModalController } from '@ionic/angular/standalone';
import { HuntStatsModalPage } from '../../shared/components/hunt-stats-modal/hunt-stats-modal.page';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, ...IONIC_COMPONENTS, AnimatedActionButtonComponent],
  providers: [ModalController],
})
export class DashboardPage implements OnInit, OnDestroy {
  hunts: Hunt[] = [];
  currentActiveHunt?: number;
  allTasksCompletedSignal: WritableSignal<boolean> = signal(false); // Added signal

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private huntService: HuntService,
    private alertService: AlertService,
    private modalService: ModalService,
    private huntNavigationService: HuntNavigationService, // Injected service
    private ionicModalController: ModalController, // New Ionic ModalController
    private router: Router // Injected Router
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
        this.updateCompletionStatus(); // Update completion status when progress changes
      });

    this.loadInitialData();
    this.updateCompletionStatus(); // Initial check
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
    if (hunt.isCompleted && hunt.isSkipped) return 'skipped';
    if (hunt.isCompleted) return 'completed';
    if (hunt.isSkipped) return 'skipped';
    if (hunt.startTime && !hunt.isCompleted) return 'started';
    return 'unlocked';
  }

  getHuntDisplayTitle(hunt: Hunt): string {
    if (!hunt.isUnlocked) return '?????';
    return hunt.title;
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

  async openHuntStatsModal() {
    const currentProgress = this.huntService.currentProgress;
    if (!currentProgress || !currentProgress.hunts) {
      console.warn('No hunt progress available to display stats.');
      // Optionally, show an alert to the user
      // await this.alertService.showAlert({header: 'No Stats', message: 'Complete some hunts to see stats!'});
      return;
    }

    const modal = await this.ionicModalController.create({
      component: HuntStatsModalPage,
      componentProps: {
        allHunts: currentProgress.hunts,
      },
    });
    await modal.present();
  }

  // Dashboard action button configuration
  get dashboardActionButtonConfig() {
    const allTasksCompleted = this.allTasksCompletedSignal(); // Read from signal
    const anyProgress = this.hunts.some(
      hunt => hunt.isCompleted || hunt.isSkipped || hunt.startTime
    );

    let availableStates: string[] = [];
    let currentState = '';

    if (allTasksCompleted) {
      availableStates = ['viewLeaderboard', 'reset']; // Offer both if all complete
      currentState = 'viewLeaderboard'; // Default to leaderboard if all done
    } else if (anyProgress) {
      availableStates = ['reset'];
      currentState = 'reset';
    }

    const configState: ActionButtonState = {
      ...AnimatedActionButtonComponent.DEFAULT_STATES,
      reset: {
        icon: 'refresh-circle-outline',
        color: 'warning',
        label: 'Reset Progress',
        position: 'start' as 'start',
      },
      viewLeaderboard: {
        icon: 'trophy-outline',
        color: 'success',
        label: 'View Leaderboard',
        position: 'end' as 'end',
      },
    };

    return {
      availableStates,
      handlers: {
        reset: async () => {
          await this.onResetProgress();
        },
        viewLeaderboard: async () => {
          this.router.navigate(['/leaderboard']);
        },
      },
      stateConfig: configState,
      getCurrentState: () => {
        // Re-evaluate in case state changes
        if (this.allTasksCompletedSignal()) {
          // Read from signal
          return 'viewLeaderboard';
        }
        if (
          this.hunts.some(
            hunt => hunt.isCompleted || hunt.isSkipped || hunt.startTime
          )
        ) {
          return 'reset';
        }
        return ''; // No button active if no progress and not all tasks done (should not happen based on isVisible)
      },
      isVisible: () => allTasksCompleted || anyProgress,
    };
  }

  async onResetProgress(): Promise<void> {
    const shouldReset = await this.alertService.showResetProgressAlert();

    if (shouldReset) {
      try {
        await this.huntService.resetProgress();
        this.updateCompletionStatus(); // Refresh completion status after reset
      } catch (error) {
        await this.alertService.showErrorAlert(
          'Failed to reset progress. Please try again.'
        );
      }
    }
  }

  private loadInitialData(): void {
    // Implementation of loadInitialData method
  }

  async updateCompletionStatus(): Promise<void> {
    const completed = await this.userService.areAllCurrentUserTasksCompleted();
    this.allTasksCompletedSignal.set(completed);
  }
}
