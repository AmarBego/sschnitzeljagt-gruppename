import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_COMPONENTS } from '../../../shared/utils/ionic.utils';
import { AnimatedActionButtonComponent } from '../../../shared/components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../../../shared/components/hunt-timer/hunt-timer.component';
import {
  HuntPageData,
  HuntPageHelper,
} from '../../../shared/utils/hunt-page.helper';
import { BaseHuntPage } from '../../../shared/utils/base-hunt.page';

@Component({
  selector: 'app-hunt4',
  templateUrl: './hunt4.page.html',
  styleUrls: ['./hunt4.page.scss'],
  standalone: true,
  imports: [
    ...IONIC_COMPONENTS,
    CommonModule,
    FormsModule,
    AnimatedActionButtonComponent,
    HuntTimerComponent,
  ],
  providers: [HuntPageHelper],
})
export class Hunt4Page extends BaseHuntPage {
  override get huntId(): number {
    return 4;
  }
}
