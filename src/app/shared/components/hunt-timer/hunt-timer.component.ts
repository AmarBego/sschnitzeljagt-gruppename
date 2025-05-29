import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hunt } from '../../../models/hunt.model';
import { IONIC_COMPONENTS } from '../../utils/ionic.utils';

@Component({
  selector: 'app-hunt-timer',
  template: `
    <div class="timer-container" [class.overdue]="isOverdue">
      <div class="timer-display">
        <ion-icon name="time-outline" class="timer-icon"></ion-icon>
        <span class="timer-text">{{ formatTime(timer) }}</span>
      </div>

      @if (hunt && hunt.maxDuration) {
        <div class="duration-info">
          <div class="max-duration">
            Max: {{ formatTime(hunt.maxDuration) }}
          </div>
        </div>
      }

      @if (isOverdue) {
        <div class="overdue-indicator">
          <ion-icon name="warning" class="warning-icon"></ion-icon>
          <span>Time exceeded!</span>
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
        background: var(--ion-color-danger-tint);
        border-color: var(--ion-color-danger);
        animation: pulse 2s infinite;
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
        justify-content: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .timer-icon {
        font-size: 24px;
        color: var(--ion-color-primary);
      }

      .timer-container.overdue .timer-icon {
        color: var(--ion-color-danger);
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

      .duration-info {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        opacity: 0.8;
        margin-top: 8px;
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
    `,
  ],
  imports: [CommonModule, ...IONIC_COMPONENTS],
})
export class HuntTimerComponent {
  @Input() timer: number = 0;
  @Input() hunt?: Hunt;
  @Input() isOverdue: boolean = false;

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
