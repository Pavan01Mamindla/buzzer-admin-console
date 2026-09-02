import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Crumb {
  label: string;
  link?: string[];
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="crumbs">
      <ng-container *ngFor="let c of crumbs; let last = last">
        <a *ngIf="c.link && !last" [routerLink]="c.link" class="crumb">{{ c.label }}</a>
        <span *ngIf="!c.link || last" class="crumb crumb--active">{{ c.label }}</span>
        <span *ngIf="!last" class="crumb-sep">/</span>
      </ng-container>
    </nav>
  `,
  styles: [`
    .crumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    .crumb {
      font-size: 13px;
      color: var(--text-secondary);
      background: var(--surface-2);
      padding: 6px 12px;
      border-radius: 8px;
    }
    .crumb--active {
      color: var(--text-primary);
      background: var(--surface-3);
      font-weight: 600;
    }
    .crumb-sep {
      color: var(--text-muted);
    }
  `]
})
export class BreadcrumbsComponent {
  @Input() crumbs: Crumb[] = [];
}
