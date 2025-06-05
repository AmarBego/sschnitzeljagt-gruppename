import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { HuntProgress, Hunt } from '../models/hunt.model';
import { LeaderboardEntry } from '../models/leaderboard.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly STORAGE_KEY = 'yapp_user';
  private readonly USERS_KEY = 'yapp_users';
  private readonly userSubject = new BehaviorSubject<User | null>(null);

  readonly user$ = this.userSubject.asObservable();
  readonly isNewUser$ = this.user$.pipe(map(user => !user));

  constructor() {
    this.loadUser();
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  isNewUser(): boolean {
    return !this.currentUser;
  }
  async saveUser(user: User): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.userSubject.next(user);
    } catch (error) {
      console.error('UserService: Failed to save user to localStorage.', error);
      throw new Error(
        'Failed to save user data. Storage might be full or unavailable.'
      );
    }
  }

  async updateUserPermissions(
    permissions: Partial<User['permissions']>
  ): Promise<void> {
    const user = this.currentUser;
    if (!user) return;

    const updatedUser = {
      ...user,
      permissions: { ...user.permissions, ...permissions },
    };
    await this.saveUser(updatedUser);
  }

  async completeSetup(): Promise<void> {
    const user = this.currentUser;
    if (!user) return;

    await this.saveUser({ ...user, isSetupComplete: true });
  }

  getUserStorageKey(suffix: string): string {
    const user = this.currentUser;
    if (!user?.name) {
      console.warn(
        'UserService: getUserStorageKey called without a current user name, returning generic key.'
      );
      return suffix;
    }
    return `${user.name.toLowerCase().replace(/\s+/g, '_')}_${suffix}`;
  }

  private getStorageKeyForUser(userName: string, suffix: string): string {
    if (!userName) {
      console.error(
        'UserService: getStorageKeyForUser called with empty userName.'
      );
      return suffix;
    }
    return `${userName.toLowerCase().replace(/\s+/g, '_')}_${suffix}`;
  }

  /**
   * Clears only the current user's session, leaving their hunt progress intact.
   */
  logoutCurrentUser(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.userSubject.next(null);
    console.log(
      '[UserService] Current user logged out, session cleared. Hunt progress retained.'
    );
  }

  /**
   * Clears the current user's hunt progress from localStorage AND logs them out.
   */
  resetCurrentUserProgressAndSession(): void {
    const user = this.currentUser;
    if (user?.name) {
      const huntProgressKey = this.getUserStorageKey('hunt_progress');
      localStorage.removeItem(huntProgressKey);
      console.log(
        `[UserService] Cleared hunt progress for ${user.name} from key: ${huntProgressKey}`
      );
    }
    // After clearing progress, perform the logout to clear session
    this.logoutCurrentUser();
    console.log('[UserService] Current user progress and session fully reset.');
  }

  private loadUser(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return;

    try {
      const user = JSON.parse(stored);
      this.userSubject.next(user);
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Retrieve list of all registered users.
   */
  getAllUsers(): User[] {
    const stored = localStorage.getItem(this.USERS_KEY);
    if (!stored) {
      return [];
    }
    try {
      return JSON.parse(stored) as User[];
    } catch (error) {
      console.error('Failed to parse users list:', error);
      return [];
    }
  }

  /**
   * Check if a username is already taken (case-insensitive).
   */
  async isUsernameTaken(name: string): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    return this.getAllUsers().some(
      u => u.name.trim().toLowerCase() === normalized
    );
  }

  /**
   * Register a new user in the global users list.
   */
  async registerUser(user: User): Promise<void> {
    const users = this.getAllUsers();
    users.push(user);
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to register user:', error);
      throw new Error('Could not register new user.');
    }
  }

  /**
   * Retrieve hunt progress for a specific user by their name.
   */
  private getUserHuntProgressByName(userName: string): HuntProgress | null {
    if (!userName) return null;
    const huntProgressKey = this.getStorageKeyForUser(
      userName,
      'hunt_progress'
    );
    const stored = localStorage.getItem(huntProgressKey);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored) as HuntProgress;
    } catch (error) {
      console.error(`Failed to parse hunt progress for ${userName}:`, error);
      return null;
    }
  }

  /**
   * Retrieve hunt progress for the current logged-in user.
   */
  public getCurrentUserHuntProgress(): HuntProgress | null {
    const user = this.currentUser;
    if (!user || !user.name) return null;
    const huntProgressKey = this.getUserStorageKey('hunt_progress');
    const stored = localStorage.getItem(huntProgressKey);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored) as HuntProgress;
    } catch (error) {
      console.error('Failed to parse hunt progress for current user:', error);
      return null;
    }
  }

  /**
   * Calculate leaderboard data.
   * Ranks users based on total duration of completed (non-skipped) hunts
   * and number of late completions.
   */
  public getLeaderboardData(): LeaderboardEntry[] {
    console.log('[UserService] Recalculating leaderboard data.');
    const allUsers = this.getAllUsers();
    const rankedUsers: LeaderboardEntry[] = [];
    console.log(
      `[UserService] Found ${allUsers.length} total registered users.`
    );

    for (const user of allUsers) {
      if (!user.name) {
        console.warn('[UserService] Skipping user with no name.');
        continue;
      }
      console.log(`[UserService] Processing user: ${user.name}`);

      const huntProgress = this.getUserHuntProgressByName(user.name);
      if (
        !huntProgress ||
        !huntProgress.hunts ||
        huntProgress.hunts.length === 0
      ) {
        console.log(
          `[UserService] No hunt progress or no hunts found for user: ${user.name}`
        );
        continue;
      }
      console.log(
        `[UserService] Hunt progress for ${user.name}:`,
        JSON.parse(JSON.stringify(huntProgress))
      ); // Deep copy for logging

      const completedNonSkippedHunts = huntProgress.hunts.filter(h => {
        const included = h.isCompleted && !h.isSkipped;
        // console.log(`[UserService] User ${user.name}, Hunt ID ${h.id}: isCompleted=${h.isCompleted}, isSkipped=${h.isSkipped}, Included=${included}`);
        return included;
      });

      if (completedNonSkippedHunts.length === 0) {
        console.log(
          `[UserService] No completed, non-skipped hunts for user: ${user.name}`
        );
        continue;
      }
      console.log(
        `[UserService] User ${user.name} has ${completedNonSkippedHunts.length} relevant hunts for leaderboard.`
      );

      let totalDuration = 0;
      let numLateCompletions = 0;

      for (const hunt of completedNonSkippedHunts) {
        console.log(
          `[UserService] User ${user.name}, Hunt ID ${hunt.id}: duration=${hunt.duration}, isLateCompletion=${hunt.isLateCompletion}`
        );
        totalDuration += hunt.duration || 0;
        if (hunt.isLateCompletion) {
          numLateCompletions++;
        }
      }

      rankedUsers.push({
        userName: user.name,
        totalDuration,
        numLateCompletions,
      });
      console.log(
        `[UserService] Added ${user.name} to potential leaderboard entries with duration ${totalDuration}, late: ${numLateCompletions}`
      );
    }

    rankedUsers.sort((a, b) => {
      if (a.totalDuration !== b.totalDuration) {
        return a.totalDuration - b.totalDuration;
      }
      return a.numLateCompletions - b.numLateCompletions;
    });

    console.log(
      '[UserService] Final top 3 ranked users:',
      rankedUsers.slice(0, 3)
    );
    return rankedUsers.slice(0, 3); // Top 3 users
  }

  /**
   * Check if all tasks for the current user are completed or skipped.
   */
  public async areAllCurrentUserTasksCompleted(): Promise<boolean> {
    const huntProgress = this.getCurrentUserHuntProgress();

    if (
      !huntProgress ||
      !huntProgress.hunts ||
      huntProgress.hunts.length === 0
    ) {
      return false;
    }

    return huntProgress.hunts.every(
      hunt => hunt.isCompleted || hunt.isSkipped === true
    );
  }
}
