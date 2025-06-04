import { Routes } from '@angular/router';
import { dashboardGuard } from './guards/dashboard.guard';
import { onboardingGuard } from './guards/onboarding.guard';
import { huntAccessGuard } from './guards/hunt-access.guard';
import { huntPageGuard } from './guards/hunt-page.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'onboarding',
    pathMatch: 'full',
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./pages/onboarding/onboarding.page').then(m => m.OnboardingPage),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [onboardingGuard, dashboardGuard],
  },
  {
    path: 'hunt1',
    loadComponent: () =>
      import('./pages/hunts/hunt1/hunt1.page').then(m => m.Hunt1Page),
    canActivate: [onboardingGuard, huntAccessGuard],
    canDeactivate: [huntPageGuard],
  },
  // {
  //   path: 'hunt2',
  //   loadComponent: () =>
  //     import('./pages/hunts/hunt2/hunt2.page').then(m => m.Hunt2Page),
  //   canActivate: [onboardingGuard, huntAccessGuard],
  //   canDeactivate: [huntPageGuard],
  // },
  {
    path: 'hunt2',
    loadComponent: () =>
      import('./pages/hunts/hunt3/hunt3.page').then(m => m.Hunt3Page),
    canActivate: [onboardingGuard, huntAccessGuard],
    canDeactivate: [huntPageGuard],
  },
  // {
  //   path: 'hunt4',
  //   loadComponent: () =>
  //     import('./pages/hunts/hunt4/hunt4.page').then(m => m.Hunt4Page),
  //   canActivate: [onboardingGuard, huntAccessGuard],
  //   canDeactivate: [huntPageGuard],
  // },
  {
    path: 'hunt3',
    loadComponent: () =>
      import('./pages/hunts/hunt5/hunt5.page').then(m => m.Hunt5Page),
    canActivate: [onboardingGuard, huntAccessGuard],
    canDeactivate: [huntPageGuard],
  },
  {
    path: 'hunt4',
    loadComponent: () =>
      import('./pages/hunts/hunt6/hunt6.page').then(m => m.Hunt6Page),
    canActivate: [onboardingGuard, huntAccessGuard],
    canDeactivate: [huntPageGuard],
  },
];
