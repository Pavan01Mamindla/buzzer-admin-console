import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <header class="header">
      <h1 class="header__title">{{ title }}</h1>
      <div class="header__search" *ngIf="showSearch">
        <app-icon name="search" [size]="16" />
        <input
          type="text"
          placeholder="Search"
          [ngModel]="searchTerm"
          (ngModelChange)="onSearchChange($event)"
        />
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input() title = 'Dashboard';
  @Input() showSearch = true;
  @Input() searchTerm = '';
  @Output() searchTermChange = new EventEmitter<string>();

  private debounceHandle?: ReturnType<typeof setTimeout>;

  onSearchChange(value: string): void {
    this.searchTerm = value;
    clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => this.searchTermChange.emit(value), 300);
  }
}
