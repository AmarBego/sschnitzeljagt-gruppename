import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly STORAGE_KEY = 'yapp_user';
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
      throw new Error('Failed to save user data. Storage might be full or unavailable.');
    }
  }

  async updateUserPermissions(permissions: Partial<User['permissions']>): Promise<void> {
    const user = this.currentUser;
    if (!user) return;

    const updatedUser = {
      ...user,
      permissions: { ...user.permissions, ...permissions }
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
      return suffix; // Fallback for users without names
    }
    return `${user.name.toLowerCase().replace(/\s+/g, '_')}_${suffix}`;
  }
  clearUserData(): void {
    const user = this.currentUser;
    if (user?.name) {
      const huntProgressKey = this.getUserStorageKey('hunt_progress');
      localStorage.removeItem(huntProgressKey);
    }
    
    localStorage.removeItem(this.STORAGE_KEY);
    this.userSubject.next(null);
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
}
