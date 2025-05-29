// This service handles application lifecycle events (e.g., app going to background/foreground, app closing)
// and their impact on active hunts, such as detecting abandoned hunts or ensuring proper state saving.
import { Injectable, inject } from '@angular/core';
import { HuntProgressService } from './hunt-progress.service';
import { HuntOrchestrationService } from './hunt-orchestration.service';
import { TimerService } from '../timer.service';
import { Hunt, HuntProgress } from '../../models/hunt.model';

@Injectable({
  providedIn: 'root',
})
export class HuntAppEventsService {
  private readonly huntProgressService = inject(HuntProgressService);
  private readonly huntOrchestrationService = inject(HuntOrchestrationService);
  private readonly timerService = inject(TimerService);

  private readonly ABANDONMENT_THRESHOLD = 3000; // 3 seconds

  constructor() {
    // Initial check when service is constructed (app starts)
    this.checkForAbandonedHuntOnLoad();
  }

  private checkForAbandonedHuntOnLoad(): void {
    const progress = this.huntProgressService.currentProgress;
    const backgroundTimeStr = localStorage.getItem('app_background_time');

    if (progress.currentActiveHunt && backgroundTimeStr) {
      try {
        const backgroundTime = new Date(backgroundTimeStr);
        const currentTime = new Date();
        const timeAwayMs = currentTime.getTime() - backgroundTime.getTime();
        this.processAbandonmentInternal(progress, timeAwayMs, 'onAppLoad');
      } catch (error) {
        console.error('Error checking abandoned hunt on load:', error);
      } finally {
        localStorage.removeItem('app_background_time');
      }
    }
    // Ensure timer is correctly resumed if hunt is still active
    this.resumeActiveHuntTimerIfNeeded(progress);
  }

  private processAbandonmentInternal(
    progress: HuntProgress,
    timeAwayMs: number,
    source: 'onAppLoad' | 'onForeground'
  ): void {
    if (
      !progress.currentActiveHunt ||
      timeAwayMs <= this.ABANDONMENT_THRESHOLD
    ) {
      return;
    }

    try {
      // findHuntOrFail is now in HuntProgressService, but we already have progress here.
      const activeHunt = progress.hunts.find(
        h => h.id === progress.currentActiveHunt
      );

      if (activeHunt && !activeHunt.isCompleted && !activeHunt.isSkipped) {
        // Use the orchestration service's internal skip method which doesn't call updateProgress itself
        this.huntOrchestrationService.markHuntAsSkippedInternal(
          progress, // Pass the current state of progress
          activeHunt.id,
          `App was away for ${Math.round(timeAwayMs / 1000)} seconds (detected ${source})`
        );
        // After internal processing, update the progress globally
        this.huntProgressService.updateProgress(progress);
      }
    } catch (error) {
      console.error(
        `Error processing abandonment for hunt ID ${progress.currentActiveHunt} from ${source}:`,
        error
      );
    }
  }

  private resumeActiveHuntTimerIfNeeded(progress: HuntProgress): void {
    if (!progress.currentActiveHunt) return;

    const activeHunt = progress.hunts.find(
      h => h.id === progress.currentActiveHunt
    );
    if (
      activeHunt?.startTime &&
      !activeHunt.isCompleted &&
      !activeHunt.isSkipped
    ) {
      this.timerService.startTimer(
        new Date(activeHunt.startTime),
        activeHunt.id
      );
    }
  }

  handleAppBackground(): void {
    const progress = this.huntProgressService.currentProgress;
    if (progress.currentActiveHunt) {
      localStorage.setItem('app_background_time', new Date().toISOString());
    }
  }

  handleAppForeground(timeAwayMs: number): void {
    const progress = this.huntProgressService.currentProgress;
    this.processAbandonmentInternal(progress, timeAwayMs, 'onForeground');
    localStorage.removeItem('app_background_time');
    // Ensure timer is correctly resumed if hunt is still active post-abandonment check
    this.resumeActiveHuntTimerIfNeeded(
      this.huntProgressService.currentProgress
    );
  }

  handleAppClose(): void {
    const progress = this.huntProgressService.currentProgress;
    if (progress.currentActiveHunt) {
      // Use the public skipHunt from orchestration service which handles updates
      this.huntOrchestrationService.skipHunt(
        progress.currentActiveHunt,
        'App was closed'
      );
    }
  }
}
