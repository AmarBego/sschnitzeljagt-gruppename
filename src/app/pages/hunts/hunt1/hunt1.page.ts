import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_COMPONENTS } from '../../../shared/utils/ionic.utils';
import { Geolocation, Position } from '@capacitor/geolocation';
import { AnimatedActionButtonComponent } from '../../../shared/components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../../../shared/components/hunt-timer/hunt-timer.component';
import { HuntPageHelper } from '../../../shared/utils/hunt-page.helper';
import { BaseHuntPage } from '../../../shared/utils/base-hunt.page';

@Component({
  selector: 'app-hunt1',
  templateUrl: './hunt1.page.html',
  styleUrls: ['./hunt1.page.scss'],
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
export class Hunt1Page extends BaseHuntPage {
  override get huntId(): number {
    return 1;
  }
  public predefinedPoint = {
    latitude: 47.02755556,
    longitude: 8.301,
  };
  public userLocation: { latitude: number; longitude: number } | null = null;
  public distanceToPoint: number | null = null;
  public errorMessage: string | null = null;
  public tracking: boolean = false;
  private locationInterval: any = null;

  constructor(private huntPageHelper: HuntPageHelper) {
    super();
  }
  startTracking() {
    if (this.tracking) return; // Prevent multiple intervals
    this.tracking = true;
    this.getUserLocation();
    this.locationInterval = setInterval(() => {
      this.getUserLocation();
    }, 1000); // Update every 1 second
  }

  stopTracking() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
      this.tracking = false;
    }
  }
  private async getUserLocation() {
    try {
      // Get current position
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      this.userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Calculate distance to predefined point
      this.distanceToPoint = this.haversineDistance(
        this.userLocation,
        this.predefinedPoint
      );
      if (this.distanceToPoint < 5) {
        console.log('Made it!');
        this.stopTracking();
      }
      this.errorMessage = null;
    } catch (error) {
      this.errorMessage = 'Error getting location: ';
      this.userLocation = null;
      this.distanceToPoint = null;
    }
  }

  // Haversine distance function
  private haversineDistance(
    coords1: { latitude: number; longitude: number },
    coords2: { latitude: number; longitude: number }
  ): number {
    const R = 6378137; // Earth's radius in meters
    const lat1Rad = coords1.latitude * (Math.PI / 180);
    const lat2Rad = coords2.latitude * (Math.PI / 180);
    const deltaLat = (coords2.latitude - coords1.latitude) * (Math.PI / 180);
    const deltaLon = (coords2.longitude - coords1.longitude) * (Math.PI / 180);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    return distance; // in meters
  }
}
