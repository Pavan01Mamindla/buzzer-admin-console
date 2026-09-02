import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly wakingUp = signal(false);

  ngOnInit(): void {
    const authError = this.route.snapshot.queryParamMap.get('authError');
    if (authError) {
      this.error.set(
        `You were signed out because the session check failed (HTTP ${authError}). ` +
          'Open the browser console/network tab for the exact response — see the README troubleshooting note.'
      );
    }
  }

  submit(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    // The free-tier backend sleeps after 15 min idle - first request can take
    // 30-50s. Surface that so the login doesn't look frozen/broken.
    const wakeTimer = setTimeout(() => this.wakingUp.set(true), 4000);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        clearTimeout(wakeTimer);
        this.loading.set(false);
        this.wakingUp.set(false);
        this.router.navigate(['/sports']);
      },
      error: (err) => {
        clearTimeout(wakeTimer);
        this.loading.set(false);
        this.wakingUp.set(false);
        this.error.set(
          err.status === 401 || err.status === 400
            ? 'Invalid email or password.'
            : 'Could not reach the server. Please try again.'
        );
      }
    });
  }
}
