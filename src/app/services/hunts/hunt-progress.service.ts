// This service manages the state and persistence of hunt progress.
// It holds the current hunt data, loads it from local storage, and saves updates.
// It also provides methods to query specific hunt details from the progress data.
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Hunt, HuntProgress } from '../../models/hunt.model';
import { UserService } from '../user.service';
import { INITIAL_HUNTS } from '../../data/hunt.data';

@Injectable({
  providedIn: 'root',
})
export class HuntProgressService {
  private readonly STORAGE_KEY = 'hunt_progress'; // Keep associated constants together
  private readonly progressSubject = new BehaviorSubject<HuntProgress>(
    this.getInitialProgress()
  );

  private readonly userService = inject(UserService);

  constructor() {
    this.loadProgress(); // Initialize by loading progress
  }

  readonly progress$ = this.progressSubject.asObservable();

  get currentProgress(): HuntProgress {
    return this.progressSubject.value;
  }

  private getInitialProgress(): HuntProgress {
    return {
      hunts: JSON.parse(JSON.stringify(INITIAL_HUNTS)), // Deep copy
      totalCompleted: 0,
    };
  }

  loadProgress(): void {
    // Made public for potential reload scenarios if needed by other services
    const storageKey = this.userService.getUserStorageKey(this.STORAGE_KEY);
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      this.progressSubject.next(this.getInitialProgress()); // Ensure subject has initial if nothing stored
      return;
    }

    try {
      const progress: HuntProgress = JSON.parse(stored);
      // Note: Abandoned hunt check will be handled by HuntAppEventsService, which will call this or update directly.
      this.progressSubject.next(progress);
    } catch (error) {
      console.error('Failed to load hunt progress:', error);
      this.progressSubject.next(this.getInitialProgress()); // Fallback to initial on error
    }
  }

  updateProgress(progress: HuntProgress): void {
    const storageKey = this.userService.getUserStorageKey(this.STORAGE_KEY);
    localStorage.setItem(storageKey, JSON.stringify(progress));
    this.progressSubject.next(progress);
  }

  resetProgress(): void {
    const initialProgress = this.getInitialProgress();
    this.updateProgress(initialProgress); // This will also save and notify observers
  }

  findHuntOrFail(huntId: number): Hunt {
    const progress = this.currentProgress;
    const hunt = progress.hunts.find(h => h.id === huntId);
    if (!hunt) {
      throw new Error(`HuntProgressService: Hunt with ID ${huntId} not found.`);
    }
    return hunt;
  }

  getHuntMaxDuration(huntId: number): number | undefined {
    const hunt = this.findHuntOrFail(huntId); // Uses the local findHuntOrFail
    return hunt?.maxDuration;
  }
}
