import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { TimerState } from '../models/timer.model';

@Injectable({
  providedIn: 'root'
})
export class TimerService implements OnDestroy {
  private readonly TIMER_STORAGE_KEY = 'timer_state';
  private readonly timerSubject = new BehaviorSubject<number>(0);
  private timerSubscription?: Subscription;
  private startTime?: Date;
  private currentHuntId?: number;

  readonly timer$ = this.timerSubject.asObservable();

  get currentElapsedTime(): number {
    return this.timerSubject.value;
  }

  get isRunning(): boolean {
    return !!this.timerSubscription;
  }

  get timerStartTime(): Date | undefined {
    return this.startTime;
  }

  startTimer(fromTime?: Date, huntId?: number): void {
    this.stopTimer();
    this.startTime = fromTime || new Date();
    this.currentHuntId = huntId;
    
    // Save timer state to localStorage
    this.saveTimerState();
    
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.startTime) {
        const elapsed = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
        this.timerSubject.next(elapsed);
        // Periodically save state while running
        this.saveTimerState();
      }
    });
  }

  stopTimer(): void {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = undefined;
    this.timerSubject.next(0);
    this.startTime = undefined;
    this.currentHuntId = undefined;
    this.clearTimerState();
  }

  pauseTimer(): number {
    const currentElapsed = this.timerSubject.value;
    this.stopTimer();
    return currentElapsed;
  }

  resumeTimer(): void {
    if (this.startTime) {
      const timeWhenPaused = new Date(Date.now() - (this.timerSubject.value * 1000));
      this.startTimer(timeWhenPaused, this.currentHuntId);
    }
  }

  resetTimer(): void {
    this.stopTimer();
  }

  getDuration(startTime: Date, endTime = new Date()): number {
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  }

  private saveTimerState(): void {
    if (this.startTime) {
      const state: TimerState = {
        isRunning: this.isRunning,
        startTime: this.startTime,
        elapsedTime: this.currentElapsedTime,
        huntId: this.currentHuntId
      };
      localStorage.setItem(this.TIMER_STORAGE_KEY, JSON.stringify(state));
    }
  }

  private clearTimerState(): void {
    localStorage.removeItem(this.TIMER_STORAGE_KEY);
  }

  getPersistedTimerState(): TimerState | null {
    try {
      const stored = localStorage.getItem(this.TIMER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
    }
    return null;
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
