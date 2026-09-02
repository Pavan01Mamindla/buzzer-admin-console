import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageSearchService {
  readonly term = signal('');
  readonly title = signal('Dashboard');

  setTerm(value: string): void {
    this.term.set(value);
  }

  reset(): void {
    this.term.set('');
  }
}
