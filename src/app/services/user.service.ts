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
      );

      const completedNonSkippedHunts = huntProgress.hunts.filter(
        h => h.isCompleted && !h.isSkipped
      );

      // User must have at least one completed, non-skipped hunt to be on the leaderboard
      if (completedNonSkippedHunts.length === 0) {
        console.log(
          `[UserService] No completed, non-skipped hunts for user: ${user.name}. Not adding to leaderboard.`
        );
        continue;
      }

      const numHuntsCompleted = completedNonSkippedHunts.length;
      console.log(
        `[UserService] User ${user.name} has ${numHuntsCompleted} completed (non-skipped) hunts.`
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

      const numHuntsSkipped = huntProgress.hunts.filter(
        h => h.isSkipped === true
      ).length;
      console.log(
        `[UserService] User ${user.name} has ${numHuntsSkipped} skipped hunts.`
      );

      rankedUsers.push({
        userName: user.name,
        totalDuration,
        numHuntsCompleted,
        numLateCompletions,
        numHuntsSkipped,
      });
      console.log(
        `[UserService] Added ${user.name} to potential leaderboard: duration ${totalDuration}, completed ${numHuntsCompleted}, late ${numLateCompletions}, skipped ${numHuntsSkipped}`
      );
    }

    rankedUsers.sort((a, b) => {
      // Primary: Ascending totalDuration
      if (a.totalDuration !== b.totalDuration) {
        return a.totalDuration - b.totalDuration;
      }
      // Secondary: Ascending numLateCompletions
      if (a.numLateCompletions !== b.numLateCompletions) {
        return a.numLateCompletions - b.numLateCompletions;
      }
      // Tertiary: Descending numHuntsCompleted (more completed is better for a tie)
      if (a.numHuntsCompleted !== b.numHuntsCompleted) {
        return b.numHuntsCompleted - a.numHuntsCompleted;
      }
      // Quaternary: Ascending numHuntsSkipped (fewer skipped is better for a tie, though less critical)
      // If all else is equal, someone who skipped fewer hunts might be ranked slightly higher.
      return a.numHuntsSkipped - b.numHuntsSkipped;
    });

    console.log(
      '[UserService] Final ranked users (all):',
      JSON.parse(JSON.stringify(rankedUsers))
    );
    return rankedUsers; // Return all qualifying users
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

  /**
   * Update a user's record in the global yapp_users list.
   */
  private async _updateUserInGlobalList(updatedUser: User): Promise<void> {
    if (!updatedUser || !updatedUser.name) {
      console.warn(
        '[UserService] Attempted to update user in global list without valid user object or name.'
      );
      return;
    }
    const allUsers = this.getAllUsers();
    const userIndex = allUsers.findIndex(u => u.name === updatedUser.name);

    if (userIndex !== -1) {
      allUsers[userIndex] = { ...allUsers[userIndex], ...updatedUser }; // Merge to preserve other fields if any new ones are added elsewhere
      try {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(allUsers));
        console.log(
          `[UserService] Updated user ${updatedUser.name} in global list.`
        );
      } catch (error) {
        console.error(
          `[UserService] Failed to update user ${updatedUser.name} in global list:`,
          error
        );
        // Potentially throw or handle, but for now, log and continue
      }
    } else {
      console.warn(
        `[UserService] User ${updatedUser.name} not found in global list for update.`
      );
      // This case implies the user might not have been registered, which would be an issue.
      // However, markStatsAsSubmitted should only be called for an existing, registered user.
    }
  }

  /**
   * Prepares data for submission to Google Form.
   */
  prepareGoogleFormData(
    user: User,
    huntProgress: HuntProgress
  ): {
    name: string;
    normallyCompleted: number;
    skipped: number;
    durationString: string;
  } | null {
    if (!user || !huntProgress || !huntProgress.hunts) {
      console.error(
        '[UserService] Cannot prepare Google Form data: Invalid user or hunt progress.'
      );
      return null;
    }

    const completedNonSkippedHunts = huntProgress.hunts.filter(
      h => h.isCompleted && !h.isSkipped
    );

    const normallyCompleted = completedNonSkippedHunts.filter(
      h => !h.isLateCompletion
    ).length;

    const skipped = huntProgress.hunts.filter(h => h.isSkipped === true).length;

    let totalDurationSeconds = 0;
    for (const hunt of completedNonSkippedHunts) {
      totalDurationSeconds += hunt.duration || 0;
    }

    const hours = Math.floor(totalDurationSeconds / 3600);
    const minutes = Math.floor((totalDurationSeconds % 3600) / 60);
    const seconds = totalDurationSeconds % 60;
    const durationString = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return {
      name: user.name,
      normallyCompleted,
      skipped,
      durationString,
    };
  }

  /**
   * Marks the current user's stats as submitted and updates their record.
   */
  async markStatsAsSubmitted(): Promise<void> {
    const currentUser = this.currentUser;
    if (!currentUser) {
      console.warn('[UserService] No current user to mark stats as submitted.');
      return;
    }

    const updatedUser = { ...currentUser, hasSubmittedFinalStats: true };

    await this.saveUser(updatedUser); // Updates current session user (yapp_user)
    await this._updateUserInGlobalList(updatedUser); // Updates user in global list (yapp_users)
    console.log(
      `[UserService] Marked final stats as submitted for user: ${currentUser.name}`
    );
  }
}
