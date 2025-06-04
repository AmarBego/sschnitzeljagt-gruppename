import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular'; // Assuming Ionic components might be used
import { OnboardingService } from '../../services/onboarding.service'; // Added OnboardingService import

@Component({
  selector: 'app-onboarding',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Onboarding</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>Welcome to Yapp!</h1>
      <p>Please follow the prompts to set up your profile and permissions.</p>
      <!-- OnboardingService will handle the alerts -->
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule], // Add FormsModule if needed for inputs
})
export class OnboardingPage implements OnInit {
  // Implemented OnInit
  private readonly onboardingService = inject(OnboardingService); // Injected OnboardingService

  constructor() {}

  ngOnInit() {
    // Start the onboarding flow when this page loads
    this.onboardingService.startOnboardingFlow();
  }
}
