import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage implements OnInit {
  constructor() {}

  async ngOnInit(): Promise<void> {
    // Start onboarding flow when home page loads -- THIS LOGIC IS BEING MOVED TO ONBOARDING.PAGE.TS
    // await this.onboardingService.startOnboardingFlow(); // Removed call
  }
}
