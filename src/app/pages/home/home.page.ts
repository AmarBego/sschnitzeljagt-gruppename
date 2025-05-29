import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';
import { OnboardingService } from '../../services/onboarding.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage implements OnInit {
  constructor(private onboardingService: OnboardingService) {}

  async ngOnInit(): Promise<void> {
    // Start onboarding flow when home page loads
    await this.onboardingService.startOnboardingFlow();
  }
}
