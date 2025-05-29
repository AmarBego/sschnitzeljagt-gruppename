import { Routes } from '@angular/router';
import { DashboardGuard } from './guards/dashboard.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [DashboardGuard],
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'hunt1',
    loadComponent: () =>
      import('./pages/hunts/hunt1/hunt1.page').then(m => m.Hunt1Page),
  },
  {
    path: 'hunt2',
    loadComponent: () =>
      import('./pages/hunts/hunt2/hunt2.page').then(m => m.Hunt2Page),
  },
  {
    path: 'hunt3',
    loadComponent: () =>
      import('./pages/hunts/hunt3/hunt3.page').then(m => m.Hunt3Page),
  },
  {
    path: 'hunt4',
    loadComponent: () =>
      import('./pages/hunts/hunt4/hunt4.page').then(m => m.Hunt4Page),
  },
  {
    path: 'hunt5',
    loadComponent: () =>
      import('./pages/hunts/hunt5/hunt5.page').then(m => m.Hunt5Page),
  },
  {
    path: 'hunt6',
    loadComponent: () =>
      import('./pages/hunts/hunt6/hunt6.page').then(m => m.Hunt6Page),
  },
];
