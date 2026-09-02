import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export interface EntityField {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'url' | 'color' | 'number';
  required?: boolean;
}

@Component({
  selector: 'app-entity-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="overlay" (click)="close.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog__head">
          <h3>{{ title }}</h3>
          <button class="btn-icon" type="button" (click)="close.emit()"><app-icon name="close" [size]="16" /></button>
        </div>

        <div class="dialog__body">
          <div class="field" *ngFor="let field of fields">
            <label>{{ field.label }}<span *ngIf="field.required" class="req">*</span></label>

            <textarea
              *ngIf="field.type === 'textarea'; else singleLine"
              [placeholder]="field.placeholder || ''"
              [(ngModel)]="model[field.key]"
              rows="3"
            ></textarea>

            <ng-template #singleLine>
              <div class="color-row" *ngIf="field.type === 'color'; else plainInput">
                <input type="color" [(ngModel)]="model[field.key]" class="color-swatch" />
                <input type="text" [(ngModel)]="model[field.key]" [placeholder]="field.placeholder || '#FFFFFF'" />
              </div>
              <ng-template #plainInput>
                <input
                  [type]="field.type === 'number' ? 'number' : 'text'"
                  [placeholder]="field.placeholder || ''"
                  [(ngModel)]="model[field.key]"
                  [class.field-invalid]="fieldErrors[field.key]"
                />
              </ng-template>
            </ng-template>
            <p class="field-error" *ngIf="fieldErrors[field.key]">{{ fieldErrors[field.key] }}</p>
          </div>

          <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
        </div>

        <div class="dialog__actions">
          <button class="btn btn-secondary" type="button" (click)="close.emit()">Cancel</button>
          <button class="btn btn-primary" type="button" [disabled]="!isValid() || saving" (click)="save.emit(model)">
            {{ saving ? 'Saving…' : saveLabel }}
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
      padding: 20px;
    }
    .dialog {
      background: var(--surface-1);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-lg);
      padding: 22px;
      width: 460px;
      max-width: 100%;
    }
    .dialog__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .dialog__head h3 { margin: 0; font-size: 17px; }
    .field { margin-bottom: 14px; }
    .field label {
      display: block;
      font-size: 12.5px;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }
    .req { color: var(--accent-red); margin-left: 3px; }
    .field-invalid { border-color: var(--accent-red) !important; }
    .field-error { color: var(--accent-red); font-size: 12px; margin: 5px 0 0; }
    .color-row { display: flex; align-items: center; gap: 10px; }
    .color-swatch {
      width: 42px;
      height: 42px;
      padding: 2px;
      border-radius: 8px;
      flex: none;
    }
    .error { color: var(--accent-red); font-size: 13px; margin: -4px 0 10px; }
    .dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 6px;
    }
  `]
})
export class EntityFormDialogComponent implements OnInit {
  @Input() title = 'Add item';
  @Input() saveLabel = 'Save';
  @Input() fields: EntityField[] = [];
  @Input() initialValue: Record<string, unknown> = {};
  @Input() saving = false;
  @Input() errorMessage = '';
  @Input() fieldErrors: Record<string, string> = {};

  @Output() save = new EventEmitter<Record<string, unknown>>();
  @Output() close = new EventEmitter<void>();

  model: Record<string, unknown> = {};

  ngOnInit(): void {
    this.model = { ...this.initialValue };
  }

  isValid(): boolean {
    return this.fields
      .filter((f) => f.required)
      .every((f) => `${this.model[f.key] ?? ''}`.trim().length > 0);
  }
}
