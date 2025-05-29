import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_COMPONENTS } from './ionic.utils';
import { AnimatedActionButtonComponent } from '../components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../components/hunt-timer/hunt-timer.component';
import {
  HuntPageHelper,
  HuntPageData,
  HuntActionButtonConfig,
} from './hunt-page.helper';
import { Hunt } from '../../models/hunt.model';

@Component({
  template: '', // Base component, no template
  standalone: true,
  imports: [
    ...IONIC_COMPONENTS,
    CommonModule,
    FormsModule,
    AnimatedActionButtonComponent,
    HuntTimerComponent,
  ],
})
export abstract class BaseHuntPage implements OnInit, OnDestroy {
  protected huntHelper = inject(HuntPageHelper);

  huntData: HuntPageData = {
    timer: 0,
    isHuntActive: false,
  };

  abstract get huntId(): number;

  ngOnInit() {
    this.huntHelper.initializeForHunt(this.huntId, data => {
      this.huntData = data;
    });
  }

  ngOnDestroy() {
    // HuntPageHelper already has ngOnDestroy,
    // but we call it to ensure it's cleaned up when the derived component is destroyed.
    // If HuntPageHelper is provided in BaseHuntPage, its lifecycle is tied to BaseHuntPage.
    // If HuntPageHelper is provided in each hunt page, then this call is essential from derived.
    // Given it is in providers here, this might be redundant if Angular handles it,
    // but it's safer to explicitly call.
    this.huntHelper.ngOnDestroy();
  }

  get isOverdue(): boolean {
    return this.huntHelper.isHuntOverdue(this.huntData.currentHunt);
  }

  get actionButtonConfig(): HuntActionButtonConfig {
    return this.huntHelper.actionButtonConfiguration;
  }

  formatTime(seconds: number): string {
    return this.huntHelper.formatTime(seconds);
  }

  getHuntStatus(hunt?: Hunt): string {
    return this.huntHelper.getHuntStatus(hunt);
  }

  isHuntOverdue(hunt?: Hunt): boolean {
    return this.huntHelper.isHuntOverdue(hunt);
  }

  getRemainingTime(hunt?: Hunt): number | null {
    return this.huntHelper.getRemainingTime(hunt);
  }
}
