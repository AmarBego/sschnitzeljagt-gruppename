import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimerService implements OnDestroy {
  private readonly timerSubject = new BehaviorSubject<number>(0);
  private timerSubscription?: Subscription;
  private startTime?: Date;

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
  startTimer(fromTime?: Date): void {
    this.stopTimer();
    this.startTime = fromTime || new Date();
    
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.startTime) {
        const elapsed = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
        this.timerSubject.next(elapsed);
      }
    });
  }

  stopTimer(): void {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = undefined;
    this.timerSubject.next(0);
    this.startTime = undefined;
  }

  pauseTimer(): number {
    const currentElapsed = this.timerSubject.value;
    this.stopTimer();
    return currentElapsed;
  }

  resumeTimer(): void {
    if (this.startTime) {
      const timeWhenPaused = new Date(Date.now() - (this.timerSubject.value * 1000));
      this.startTimer(timeWhenPaused);
    }
  }

  resetTimer(): void {
    this.stopTimer();
  }

  getDuration(startTime: Date, endTime = new Date()): number {
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
