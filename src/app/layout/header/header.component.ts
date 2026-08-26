import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  AuthService
} from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  get userEmail(): string {
    return this.auth.user()?.email ?? 'Admin';
  }

  logout(): void {
    this.auth.logout();

    this.router.navigate(['/login']);
  }
}
