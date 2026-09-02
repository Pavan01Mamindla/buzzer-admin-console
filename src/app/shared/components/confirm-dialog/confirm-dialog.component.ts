import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="overlay" (click)="cancel.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog__icon"><app-icon name="warning" [size]="22" color="var(--accent-red)" /></div>
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="dialog__actions">
          <button class="btn btn-secondary" type="button" (click)="cancel.emit()">Cancel</button>
          <button class="btn btn-danger" type="button" (click)="confirm.emit()" [disabled]="loading">
            {{ loading ? 'Deleting…' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .dialog {
      background: var(--surface-1);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-lg);
      padding: 26px;
      width: 380px;
      text-align: center;
    }
    .dialog__icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(236, 25, 60, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 14px;
    }
    h3 { margin: 0 0 8px; font-size: 17px; }
    p { margin: 0 0 20px; color: var(--text-secondary); font-size: 14px; }
    .dialog__actions { display: flex; gap: 10px; justify-content: center; }
    .btn-danger { background: var(--accent-red); color: #fff; }
    .btn-danger:hover:not(:disabled) { opacity: 0.9; }
  `]
})
export class ConfirmDialogComponent {
  @Input() title = 'Delete item';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmLabel = 'Delete';
  @Input() loading = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
