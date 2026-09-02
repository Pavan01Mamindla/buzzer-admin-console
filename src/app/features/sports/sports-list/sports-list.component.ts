import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PageSearchService } from '../../../core/services/page-search.service';
import { SportsService } from '../../../core/services/sports.service';
import { Sport } from '../../../core/models/api.model';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EntityField, EntityFormDialogComponent } from '../../../shared/components/entity-form-dialog/entity-form-dialog.component';

@Component({
  selector: 'app-sports-list',
  standalone: true,
  imports: [CommonModule, StatCardComponent, IconComponent, ConfirmDialogComponent, EntityFormDialogComponent],
  templateUrl: './sports-list.component.html',
  styleUrl: './sports-list.component.scss'
})
export class SportsListComponent implements OnInit, OnDestroy {
  private readonly sportsService = inject(SportsService);
  readonly pageSearch = inject(PageSearchService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private isFirstSearchEffect = true;

  readonly sports = signal<Sport[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly totalSports = signal(0);

  // These aren't exposed as separate list endpoints by the API, so they're rolled
  // up client-side from whatever count fields the sport rows carry.
  readonly totalGoverningBodies = signal(0);
  readonly totalOrganisations = signal(0);
  readonly totalParticipants = signal(0);

  readonly page = signal(1);
  readonly limit = 12;
  readonly totalPages = signal(1);

  readonly showFormDialog = signal(false);
  readonly editingSport = signal<Sport | null>(null);
  readonly savingForm = signal(false);
  readonly formError = signal('');
  readonly formFieldErrors = signal<Record<string, string>>({});

  readonly deletingSport = signal<Sport | null>(null);
  readonly deleteLoading = signal(false);

  readonly sportFields: EntityField[] = [
    { key: 'name', label: 'Sport Name', placeholder: 'e.g. Rohit - Football (test)', required: true },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description' },
    { key: 'iconUrl', label: 'Icon URL', type: 'url', placeholder: 'https://…/icon.png' }
  ];

  canWrite(): boolean {
    return this.auth.canWriteCatalogue();
  }

  constructor() {
    // React to the header search box (owned by the shell) without polling.
    effect(() => {
      this.pageSearch.term();
      if (this.isFirstSearchEffect) {
        this.isFirstSearchEffect = false;
        return;
      }
      clearTimeout(this.searchDebounce);
      this.searchDebounce = setTimeout(() => {
        this.page.set(1);
        this.load();
      }, 250);
    });
  }

  ngOnInit(): void {
    this.pageSearch.title.set('Sport Management');
    this.pageSearch.reset();
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.sportsService
      .list({ search: this.pageSearch.term() || undefined, page: this.page(), limit: this.limit })
      .subscribe({
        next: (res) => {
          this.sports.set(res.data);
          this.totalSports.set(res.meta.total);
          this.totalPages.set(res.meta.totalPages ?? Math.max(1, Math.ceil(res.meta.total / this.limit)));
          this.rollUpCounts(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load sports. The backend may still be waking up — please retry in a moment.');
          this.loading.set(false);
        }
      });
  }

  private rollUpCounts(rows: Sport[]): void {
    const sum = (key: string) => rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
    this.totalGoverningBodies.set(sum('governingBodiesCount'));
    this.totalOrganisations.set(sum('organisationsCount'));
    this.totalParticipants.set(sum('participantsCount'));
  }

  goToPage(delta: number): void {
    const next = this.page() + delta;
    if (next < 1 || next > this.totalPages()) return;
    this.page.set(next);
    this.load();
  }

  openSport(sport: Sport): void {
    this.router.navigate(['/sports', sport.id]);
  }

  openAddDialog(): void {
    this.editingSport.set(null);
    this.formError.set('');
    this.formFieldErrors.set({});
    this.showFormDialog.set(true);
  }

  openEditDialog(sport: Sport, evt: Event): void {
    evt.stopPropagation();
    this.editingSport.set(sport);
    this.formError.set('');
    this.formFieldErrors.set({});
    this.showFormDialog.set(true);
  }

  closeFormDialog(): void {
    this.showFormDialog.set(false);
  }

  saveSport(value: Record<string, unknown>): void {
    this.savingForm.set(true);
    this.formError.set('');
    this.formFieldErrors.set({});
    const payload = {
      name: String(value['name'] ?? '').trim(),
      description: value['description'] ? String(value['description']) : undefined,
      iconUrl: value['iconUrl'] ? String(value['iconUrl']) : undefined
    };

    const editing = this.editingSport();
    const req = editing ? this.sportsService.update(editing.id, payload) : this.sportsService.create(payload);

    req.subscribe({
      next: () => {
        this.savingForm.set(false);
        this.showFormDialog.set(false);
        this.load();
      },
      error: (err) => {
        this.savingForm.set(false);
        if (err.status === 409) {
          // Duplicate name - shown as a field-level error under Name, not a banner.
          this.formFieldErrors.set({ name: 'A sport with this name already exists.' });
        } else if (err.status === 403) {
          this.formError.set('You do not have permission to do this (needs admin or operator).');
        } else {
          this.formError.set('Something went wrong. Please try again.');
        }
      }
    });
  }

  askDelete(sport: Sport, evt: Event): void {
    evt.stopPropagation();
    this.deletingSport.set(sport);
  }

  cancelDelete(): void {
    this.deletingSport.set(null);
  }

  confirmDelete(): void {
    const sport = this.deletingSport();
    if (!sport) return;
    this.deleteLoading.set(true);
    this.sportsService.remove(sport.id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.deletingSport.set(null);
        this.load();
      },
      error: () => {
        this.deleteLoading.set(false);
        this.deletingSport.set(null);
        this.error.set('Could not delete this sport.');
      }
    });
  }
}
