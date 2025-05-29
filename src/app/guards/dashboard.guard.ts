// This guard prevents access to the dashboard if a hunt is currently active,
// redirecting the user to their active hunt instead.
import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { HuntService } from '../services/hunt.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardGuard implements CanActivate {
  private readonly huntService = inject(HuntService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return combineLatest([
      this.userService.user$.pipe(filter(user => user !== undefined)),
      this.huntService.progress$,
    ]).pipe(
      take(1),
      map(([user, huntProgress]) => {
        const activeHuntId = huntProgress.currentActiveHunt;
        if (activeHuntId !== undefined) {
          const activeHuntUrl = `/hunt${activeHuntId}`;
          return this.router.parseUrl(activeHuntUrl);
        } else {
          return true;
        }
      })
    );
  }
}
