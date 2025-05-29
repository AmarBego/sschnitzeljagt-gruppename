import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { HuntService } from '../../../services/hunt.service';
import { AlertService } from '../../../services/alert.service';
import { TimerService } from '../../../services/timer.service';
import { Hunt, HuntProgress } from '../../../models/hunt.model';
import { IONIC_COMPONENTS } from '../../ionic.utils';

export type ButtonState = 'reset' | 'skip' | 'complete';

@Component({
  selector: 'app-animated-action-button',
  templateUrl: './animated-action-button.component.html',
  styleUrls: ['./animated-action-button.component.scss'],
  imports: [
    CommonModule,
    ...IONIC_COMPONENTS
  ]
})
export class AnimatedActionButtonComponent implements OnInit, OnDestroy {
  @Input() position: 'bottom-start' | 'bottom-end' = 'bottom-start';
  @Output() actionPerformed = new EventEmitter<ButtonState>();  currentState: ButtonState = 'reset';
  currentHunt?: Hunt;
  isVisible = true;
  
  private destroy$ = new Subject<void>();
  constructor(
    private huntService: HuntService,
    private alertService: AlertService,
    private timerService: TimerService
  ) {}
  ngOnInit(): void {
    // Subscribe to hunt progress to determine button state
    this.huntService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe((progress: HuntProgress) => {
        this.updateButtonState(progress);
      });

    // Subscribe to timer updates for real-time button state changes
    this.timerService.timer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Update button state when timer changes
        this.updateButtonState(this.huntService.currentProgress);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private updateButtonState(progress: HuntProgress): void {
    const previousState = this.currentState;
    
    if (progress.currentActiveHunt) {
      const activeHunt = progress.hunts.find(h => h.id === progress.currentActiveHunt);
      if (activeHunt) {
        this.currentHunt = activeHunt;
        
        // Check if all tasks in hunt are completed
        // For now, we'll assume hunt is ready to complete if it's started
        // You can modify this logic based on your hunt completion criteria
        if (this.isHuntReadyToComplete(activeHunt)) {
          this.currentState = 'complete';
        } else {
          this.currentState = 'skip';
        }
      }
    } else {
      this.currentState = 'reset';
      this.currentHunt = undefined;
    }    // Force re-render of animation when state changes
    if (previousState !== this.currentState) {
      // State changed - position will update automatically via template
    }
  }  private isHuntReadyToComplete(hunt: Hunt): boolean {
    // Check if hunt has started
    if (!hunt.startTime) return false;
    
    // Check if timer is actually running for this hunt
    if (!this.timerService.isRunning) return false;
    
    // Use timer service to get current elapsed time for accurate timing
    const currentElapsedTime = this.timerService.currentElapsedTime;
    
    // If hunt has a maximum duration, check if it's reached or exceeded
    if (hunt.maxDuration && hunt.maxDuration > 0) {
      // Allow completion when 80% of max duration is reached or duration is exceeded
      const threshold = Math.floor(hunt.maxDuration * 0.8);
      return currentElapsedTime >= threshold;
    }
    
    // Fallback: ready to complete after 5 seconds if no max duration is set
    return currentElapsedTime > 5;
  }

  async onButtonClick(): Promise<void> {
    switch (this.currentState) {
      case 'reset':
        await this.handleReset();
        break;
      case 'skip':
        await this.handleSkip();
        break;
      case 'complete':
        await this.handleComplete();
        break;
    }
  }

  private async handleReset(): Promise<void> {
    const shouldReset = await this.alertService.showResetProgressAlert();
    if (shouldReset) {
      this.huntService.resetUserProgress();
      this.actionPerformed.emit('reset');
    }
  }

  private async handleSkip(): Promise<void> {
    if (!this.currentHunt) return;
    
    const shouldSkip = await this.alertService.showSkipHuntAlert(this.currentHunt.title);
    if (shouldSkip) {
      this.huntService.skipHunt(this.currentHunt.id);
      this.actionPerformed.emit('skip');
    }
  }

  private async handleComplete(): Promise<void> {
    if (!this.currentHunt) return;
    
    this.huntService.completeHunt(this.currentHunt.id);
    this.actionPerformed.emit('complete');
  }

  getButtonColor(): string {
    switch (this.currentState) {
      case 'reset': return 'danger';
      case 'skip': return 'warning';
      case 'complete': return 'success';
      default: return 'primary';
    }
  }

  getButtonIcon(): string {
    switch (this.currentState) {
      case 'reset': return 'trash-bin';
      case 'skip': return 'play-skip-forward';
      case 'complete': return 'checkmark';
      default: return 'help';
    }
  }  getButtonClass(): string {
    const dynamicPosition = this.getDynamicPosition();
    return `action-button action-button-${this.currentState} position-${dynamicPosition}`;
  }

  private getDynamicPosition(): string {
    // Reset button stays on the left, skip and complete go to the right
    switch (this.currentState) {
      case 'reset':
        return 'bottom-start'; // Left side
      case 'skip':
      case 'complete':
        return 'bottom-end'; // Right side
      default:
        return this.position; // Fallback to input position
    }
  }
}
