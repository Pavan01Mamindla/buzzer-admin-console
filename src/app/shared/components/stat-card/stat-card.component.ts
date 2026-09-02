import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <div class="stat-card__value">{{ loading ? '—' : (value | number) }}</div>
      <div class="stat-card__label">{{ label }}</div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--surface-1);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px 22px;
      flex: 1;
      min-width: 160px;
    }
    .stat-card__value {
      font-size: 30px;
      font-weight: 700;
      line-height: 1.1;
    }
    .stat-card__label {
      margin-top: 6px;
      font-size: 12px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 600;
    }
  `]
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value = 0;
  @Input() loading = false;
}
