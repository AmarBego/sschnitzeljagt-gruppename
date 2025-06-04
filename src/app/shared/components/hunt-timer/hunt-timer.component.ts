import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hunt } from '../../../models/hunt.model';
import { IONIC_COMPONENTS } from '../../utils/ionic.utils';

@Component({
  selector: 'app-hunt-timer',
  imports: [CommonModule, ...IONIC_COMPONENTS],
  templateUrl: './hunt-timer.component.html',
  styleUrls: ['./hunt-timer.component.scss'],
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
