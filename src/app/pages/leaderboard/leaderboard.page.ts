import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { UserService } from '../../services/user.service';
import { LeaderboardEntry } from '../../models/leaderboard.model';
import {
  AnimatedActionButtonComponent,
  ActionButtonState,
} from '../../shared/components/animated-action-button/animated-action-button.component';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule, // IonicModule exports IonListHeader, IonBackButton, etc.
    AnimatedActionButtonComponent,
  ],
})
export class LeaderboardPage implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);

  leaderboardData: LeaderboardEntry[] = [];

  // FAB Config
  leaderboardFabConfig: {
    availableStates: string[];
    handlers: Record<string, () => void | Promise<void>>;
    stateConfig: ActionButtonState;
    getCurrentState: () => string;
    isVisible: boolean;
  };

  constructor() {
    this.leaderboardFabConfig = {
      availableStates: ['logout'],
      handlers: {
        logout: async () => {
          this.userService.logoutCurrentUser();
          this.router.navigate(['/onboarding']);
        },
      },
      stateConfig: {
        logout: {
          icon: 'log-out-outline',
          color: 'danger',
          label: 'Log Out',
          position: 'end',
        },
      },
      getCurrentState: () => 'logout',
      isVisible: true,
    };
  }

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  ionViewWillEnter(): void {
    // Reload data if the view is entered again, e.g., after navigating back
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.leaderboardData = this.userService.getLeaderboardData();
  }

  formatDuration(totalSeconds: number): string {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
      return '00:00';
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
}
