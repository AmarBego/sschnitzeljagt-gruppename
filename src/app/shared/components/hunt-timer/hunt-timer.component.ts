import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hunt } from '../../../models/hunt.model';
import { IONIC_COMPONENTS } from '../../utils/ionic.utils';

@Component({
  selector: 'app-hunt-timer',
  template: `
    <div
      class="timer-container"
      [class.overdue]="isOverdue"
      [class.completed]="completionTime !== null"
    >
      <div class="timer-display">
        <div class="timer-main">
          <ion-icon name="time-outline" class="timer-icon"></ion-icon>
          <span class="timer-text">{{ formatTime(displayTime) }}</span>
        </div>
        @if (hunt && hunt.maxDuration) {
          <div class="max-duration">
            Max: {{ formatTime(hunt.maxDuration) }}
          </div>
        }
      </div>

      @if (isOverdue) {
        <div class="overdue-indicator">
          <ion-icon name="warning" class="warning-icon"></ion-icon>
          <span>Time exceeded!</span>
        </div>
      }

      @if (completionTime !== null) {
        <div class="completion-indicator">
          <ion-icon
            name="checkmark-done-outline"
            class="success-icon"
          ></ion-icon>
          <span>Task completed!</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .timer-container {
        border-radius: 12px;
        padding: 16px;
        margin: 16px;
        text-align: center;
        border: 2px solid var(--ion-color-primary);
        transition: all 0.3s ease;
      }

      .timer-container.overdue {
        border-color: var(--ion-color-danger);
        animation: pulse 2s infinite;
      }

      .timer-container.completed {
        border-color: var(--ion-color-success);
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.02);
        }
        100% {
          transform: scale(1);
        }
      }
      .timer-display {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        position: relative;
      }

      .timer-main {
        margin-top: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
      }

      .max-duration {
        margin-top: 8px;
        font-size: 14px;
        opacity: 0.8;
        color: var(--ion-color-medium);
        white-space: nowrap;
        margin-left: auto;
      }

      .timer-container.overdue .max-duration {
        color: var(--ion-color-danger);
        opacity: 0.9;
      }

      .timer-icon {
        font-size: 24px;
        color: var(--ion-color-primary);
      }

      .timer-container.overdue .timer-icon {
        color: var(--ion-color-danger);
      }

      .timer-container.completed .timer-icon {
        color: var(--ion-color-success);
      }

      .timer-text {
        font-family: 'Courier New', monospace;
        font-size: 28px;
        font-weight: bold;
        color: var(--ion-color-primary);
      }
      .timer-container.overdue .timer-text {
        color: var(--ion-color-danger);
      }

      .timer-container.completed .timer-text {
        color: var(--ion-color-success);
      }

      .overdue-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        color: var(--ion-color-danger);
        font-weight: bold;
        margin-top: 8px;
        animation: blink 1s infinite;
      }

      .completion-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        color: var(--ion-color-success);
        font-weight: bold;
        margin-top: 8px;
      }

      @keyframes blink {
        0%,
        50% {
          opacity: 1;
        }
        51%,
        100% {
          opacity: 0.5;
        }
      }

      .warning-icon {
        font-size: 16px;
      }

      .success-icon {
        font-size: 16px;
      }
    `,
  ],
  imports: [CommonModule, ...IONIC_COMPONENTS],
})
export class HuntTimerComponent {
  @Input() timer: number = 0;
  @Input() hunt?: Hunt;
  @Input() isOverdue: boolean = false;
  @Input() completionTime: number | null = null;

  get displayTime(): number {
    return this.completionTime !== null ? this.completionTime : this.timer;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
