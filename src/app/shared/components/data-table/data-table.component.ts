import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th *ngFor="let col of columns">{{ col.label }}</th>
            <th class="actions-col" *ngIf="showActions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows" (click)="rowClick.emit(row)" [class.clickable]="rowClickable">
            <td *ngFor="let col of columns">
              <ng-container [ngSwitch]="col.key">
                <span *ngSwitchCase="'name'" class="name-cell">
                  <span class="row-icon" *ngIf="row['iconUrl'] || row['crestUrl']">
                    <img [src]="row['iconUrl'] || row['crestUrl']" [alt]="row['name']" />
                  </span>
                  {{ row[col.key] }}
                  <app-icon *ngIf="row['verified']" name="check" [size]="14" color="var(--accent-green)" />
                </span>
                <span *ngSwitchDefault>{{ row[col.key] ?? '—' }}</span>
              </ng-container>
            </td>
            <td class="actions-col" *ngIf="showActions" (click)="$event.stopPropagation()">
              <button class="btn-icon" type="button" (click)="edit.emit(row)" title="Edit">
                <app-icon name="edit" [size]="15" />
              </button>
              <button class="btn-icon btn-icon-danger" type="button" (click)="delete.emit(row)" title="Delete">
                <app-icon name="trash" [size]="15" />
              </button>
            </td>
          </tr>

          <tr *ngIf="!loading && !errorMessage && rows.length === 0">
            <td [attr.colspan]="columns.length + (showActions ? 1 : 0)" class="empty-cell">
              {{ emptyMessage }}
            </td>
          </tr>
          <tr *ngIf="loading">
            <td [attr.colspan]="columns.length + (showActions ? 1 : 0)" class="empty-cell">
              Loading…
            </td>
          </tr>
          <tr *ngIf="!loading && errorMessage">
            <td [attr.colspan]="columns.length + (showActions ? 1 : 0)" class="error-cell">
              <app-icon name="warning" [size]="16" color="var(--accent-red)" />
              {{ errorMessage }}
              <button class="retry-link" type="button" *ngIf="retry.observed" (click)="retry.emit()">Retry</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" *ngIf="!loading && !errorMessage && totalPages > 1">
      <button class="btn-icon" [disabled]="page <= 1" (click)="pageChange.emit(page - 1)">
        <app-icon name="chevronLeft" [size]="14" />
      </button>
      <span>Page {{ page }} of {{ totalPages }}</span>
      <button class="btn-icon" [disabled]="page >= totalPages" (click)="pageChange.emit(page + 1)">
        <app-icon name="chevronRight" [size]="14" />
      </button>
    </div>
  `,
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() rows: Record<string, any>[] = [];
  @Input() showActions = true;
  @Input() rowClickable = false;
  @Input() loading = false;
  @Input() emptyMessage = 'Nothing here yet.';
  @Input() errorMessage = '';
  @Input() page = 1;
  @Input() totalPages = 1;

  @Output() edit = new EventEmitter<Record<string, any>>();
  @Output() delete = new EventEmitter<Record<string, any>>();
  @Output() rowClick = new EventEmitter<Record<string, any>>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() retry = new EventEmitter<void>();
}
