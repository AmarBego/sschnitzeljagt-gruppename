import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trashBin,
  home,
  search,
  person,
  settings,
  helpCircleOutline,
  close,
  bulbOutline,
  timeOutline,
} from 'ionicons/icons';
import { HuntService } from './services/hunt.service';
import { Subject, takeUntil } from 'rxjs';
import { StatusBarService } from './services/status-bar.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private huntService = inject(HuntService);
  private statusBarService = inject(StatusBarService);
  private appHiddenTime?: Date;

  constructor() {
    addIcons({
      trashBin,
      home,
      search,
      person,
      settings,
      helpCircleOutline,
      close,
      bulbOutline,
      timeOutline,
    });
  }

  async ngOnInit() {
    // Configure status bar for fullscreen experience
    await this.statusBarService.configureStatusBar();
    // Listen for app visibility changes
    this.setupAppLifecycleListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.removeAppLifecycleListeners();
  }

  private setupAppLifecycleListeners() {
    // Listen for page visibility changes (web/PWA)
    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );

    // Listen for beforeunload (web)
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // Listen for pagehide (web)
    window.addEventListener('pagehide', this.handlePageHide.bind(this));
  }

  private removeAppLifecycleListeners() {
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );
    window.removeEventListener(
      'beforeunload',
      this.handleBeforeUnload.bind(this)
    );
    window.removeEventListener('pagehide', this.handlePageHide.bind(this));
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      // App went to background
      this.appHiddenTime = new Date();
      this.huntService.handleAppBackground();
    } else {
      // App came to foreground
      if (this.appHiddenTime) {
        const timeAway = Date.now() - this.appHiddenTime.getTime();
        this.huntService.handleAppForeground(timeAway);
        this.appHiddenTime = undefined;
      }
    }
  }

  private handleBeforeUnload() {
    // Only mark hunt as abandoned on actual close, not refresh
    // Set background time for refresh detection
    this.huntService.handleAppBackground();
  }

  private handlePageHide() {
    // App page is being hidden (mobile browsers)
    this.huntService.handleAppBackground();
  }
}
