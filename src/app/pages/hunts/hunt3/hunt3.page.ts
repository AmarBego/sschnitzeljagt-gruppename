import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import {
  AnimatedActionButtonComponent,
  ButtonState,
} from '../../../shared/components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../../../shared/components/hunt-timer/hunt-timer.component';
import {
  HuntPageHelper,
  HuntPageData,
} from '../../../shared/utils/hunt-page.helper';

@Component({
  selector: 'app-hunt3',
  templateUrl: './hunt3.page.html',
  styleUrls: ['./hunt3.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    AnimatedActionButtonComponent,
    HuntTimerComponent,
  ],
  providers: [HuntPageHelper],
})
export class Hunt3Page implements OnInit, OnDestroy {
  huntData: HuntPageData = {
    timer: 0,
    isHuntActive: false,
  };

  constructor(private huntHelper: HuntPageHelper) {}

  ngOnInit() {
    this.huntHelper.initializeForHunt(3, data => {
      this.huntData = data;
    });
  }

  ngOnDestroy() {
    this.huntHelper.ngOnDestroy();
  }

  onActionPerformed(action: ButtonState): void {
    this.huntHelper.onActionPerformed(action);
  }

  get isOverdue(): boolean {
    return this.huntHelper.isHuntOverdue(this.huntData.currentHunt);
  }
}
