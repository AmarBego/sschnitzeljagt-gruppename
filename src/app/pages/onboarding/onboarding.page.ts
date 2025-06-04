import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular'; // Assuming Ionic components might be used
import { OnboardingService } from '../../services/onboarding.service'; // Added OnboardingService import

@Component({
  selector: 'app-onboarding',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Welcome to Yapp!</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>Welcome to Yapp - Your Scavenger Hunt Adventure!</h1>
      <p>
        Get ready to explore and discover hidden treasures! Yapp is a scavenger
        hunt application that guides you through exciting challenges.
      </p>
      <p>To make this adventure possible, we need a couple of things:</p>
      <ul>
        <li>
          <strong>Location Access:</strong> This helps us guide you to treasure
          locations and confirm you've found them.
        </li>
        <li>
          <strong>Camera Access:</strong> You'll need this to scan QR codes at
          various checkpoints and for some treasure validation.
        </li>
      </ul>
      <p>
        Your privacy is important to us. We only use these permissions during
        active hunts to enhance your experience.
      </p>
      <ion-button expand="block" (click)="proceedToSetup()"
        >Start Setup</ion-button
      >
      <!-- OnboardingService will handle the alerts once setup starts -->
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
    // Onboarding flow will now be started by proceedToSetup()
  }

  proceedToSetup(): void {
    // Start the onboarding flow when the user clicks the button
    this.onboardingService.startOnboardingFlow();
  }
}
