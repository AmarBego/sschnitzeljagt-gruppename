import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly STORAGE_KEY = 'yapp_user';
  private userSubject = new BehaviorSubject<User | null>(null);

  constructor() {
    this.loadUser();
  }

  get user$(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  isNewUser(): boolean {
    return !this.currentUser;
  }

  async saveUser(user: User): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  async updateUserPermissions(permissions: Partial<User['permissions']>): Promise<void> {
    const user = this.currentUser;
    if (user) {
      const updatedUser = {
        ...user,
        permissions: { ...user.permissions, ...permissions }
      };
      await this.saveUser(updatedUser);
    }
  }

  async completeSetup(): Promise<void> {
    const user = this.currentUser;
    if (user) {
      await this.saveUser({ ...user, isSetupComplete: true });
    }
  }

  private loadUser(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.userSubject.next(user);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }
}
