import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import { IONIC_COMPONENTS } from '../../utils/ionic.utils';

export interface ActionButtonConfig {
  icon: string;
  color: string;
  label?: string;
  position?: 'start' | 'end';
}

export interface ActionButtonState {
  [stateName: string]: ActionButtonConfig;
}

@Component({
  selector: 'app-animated-action-button',
  templateUrl: './animated-action-button.component.html',
  styleUrls: ['./animated-action-button.component.scss'],
  imports: [CommonModule, ...IONIC_COMPONENTS],
})
export class AnimatedActionButtonComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() availableStates: string[] = [];
  @Input() getState?: () => string;
  @Input() handlers: Record<string, () => void | Promise<void>> = {};
  @Input() stateConfig: ActionButtonState = {};
  @Input() position: 'bottom-start' | 'bottom-end' = 'bottom-start';
  @Input() isVisible?: boolean | (() => boolean) = true;
  @Input() updateInterval?: number; // milliseconds, for periodic state updates
  @Input() size: 'small' | 'default' | 'large' = 'small';

  @Output() actionPerformed = new EventEmitter<string>();

  currentState: string = '';
  private destroy$ = new Subject<void>();
  private updateTimer$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.initializeState();
    this.setupPeriodicUpdates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['availableStates'] || changes['getState']) {
      this.updateCurrentState();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.updateTimer$.next();
    this.updateTimer$.complete();
  }

  private initializeState(): void {
    this.updateCurrentState();
  }

  private setupPeriodicUpdates(): void {
    if (this.updateInterval && this.updateInterval > 0) {
      interval(this.updateInterval)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateCurrentState();
        });
    }
  }

  private updateCurrentState(): void {
    if (this.getState && this.availableStates.length > 0) {
      const newState = this.getState();
      if (this.availableStates.includes(newState)) {
        this.currentState = newState;
      } else if (this.availableStates.length > 0) {
        // Fallback to first available state if current state is not available
        this.currentState = this.availableStates[0];
      }
    } else if (this.availableStates.length > 0) {
      // No getState function, use first available state
      this.currentState = this.availableStates[0];
    }
  }
  async onButtonClick(): Promise<void> {
    if (this.currentState && this.handlers[this.currentState]) {
      try {
        await this.handlers[this.currentState]();
        this.actionPerformed.emit(this.currentState);
      } catch (error) {
        console.error(
          `Error executing handler for state '${this.currentState}':`,
          error
        );
      }
    }
  }

  getButtonColor(): string {
    const config = this.stateConfig[this.currentState];
    return config?.color || 'primary';
  }

  getButtonIcon(): string {
    const config = this.stateConfig[this.currentState];
    return config?.icon || 'help';
  }

  getButtonLabel(): string | undefined {
    const config = this.stateConfig[this.currentState];
    return config?.label;
  }

  getButtonClass(): string {
    const dynamicPosition = this.getDynamicPosition();
    return `action-button action-button-${this.currentState} position-${dynamicPosition}`;
  }

  private getDynamicPosition(): string {
    const config = this.stateConfig[this.currentState];
    if (config?.position) {
      return config.position;
    }

    // Fallback to input position or default logic
    return this.position === 'bottom-start' ? 'start' : 'end';
  }

  getHorizontalPosition(): 'start' | 'end' {
    const config = this.stateConfig[this.currentState];
    if (config?.position) {
      return config.position;
    }

    // Default positioning logic
    return this.position === 'bottom-start' ? 'start' : 'end';
  }

  get isButtonVisible(): boolean {
    if (typeof this.isVisible === 'function') {
      return this.isVisible();
    }

    return (
      this.isVisible !== false &&
      this.currentState !== '' &&
      this.availableStates.length > 0
    );
  }

  // Default state configurations for common use cases
  static readonly DEFAULT_STATES: ActionButtonState = {
    reset: {
      icon: 'trash-bin',
      color: 'danger',
      position: 'start',
    },
    skip: {
      icon: 'play-skip-forward',
      color: 'warning',
      position: 'end',
    },
    complete: {
      icon: 'checkmark-circle',
      color: 'success',
      position: 'end',
    },
    submit: {
      icon: 'send',
      color: 'primary',
      position: 'end',
    },
    delete: {
      icon: 'trash',
      color: 'danger',
      position: 'start',
    },
    confirm: {
      icon: 'checkmark',
      color: 'success',
      position: 'end',
    },
    cancel: {
      icon: 'close',
      color: 'medium',
      position: 'start',
    },
    edit: {
      icon: 'create',
      color: 'primary',
      position: 'end',
    },
    save: {
      icon: 'save',
      color: 'success',
      position: 'end',
    },
  };
}
