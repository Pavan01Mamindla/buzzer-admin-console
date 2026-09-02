import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PageSearchService } from '../../../core/services/page-search.service';
import { SportsService } from '../../../core/services/sports.service';
import { OrganizationTreeService } from '../../../core/services/organization.service';
import { GoverningBody, Sport } from '../../../core/models/api.model';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BreadcrumbsComponent, Crumb } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EntityField, EntityFormDialogComponent } from '../../../shared/components/entity-form-dialog/entity-form-dialog.component';

@Component({
  selector: 'app-sport-detail',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    IconComponent,
    BreadcrumbsComponent,
    ConfirmDialogComponent,
    EntityFormDialogComponent
  ],
  templateUrl: './sport-detail.component.html',
  styleUrl: './sport-detail.component.scss'
})
export class SportDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sportsService = inject(SportsService);
  private readonly orgTree = inject(OrganizationTreeService);
  private readonly auth = inject(AuthService);
  readonly pageSearch = inject(PageSearchService);

  readonly sportId = signal('');
  readonly sport = signal<Sport | null>(null);
  readonly bodies = signal<GoverningBody[]>([]);
  readonly loading = signal(true);
  readonly bodiesError = signal('');
  readonly page = signal(1);
  readonly limit = 12;
  readonly totalPages = signal(1);
  readonly total = signal(0);

  readonly showAddDialog = signal(false);
  readonly savingForm = signal(false);
  readonly formError = signal('');
  readonly formFieldErrors = signal<Record<string, string>>({});
  readonly deletingBody = signal<GoverningBody | null>(null);
  readonly deleteLoading = signal(false);

  readonly bodyFields: EntityField[] = [
    { key: 'name', label: 'Governing Body Name', placeholder: 'e.g. UEFA', required: true },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description' },
    { key: 'iconUrl', label: 'Logo URL', type: 'url', placeholder: 'https://…/logo.png' }
  ];

  private isFirstSearchEffect = true;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  constructor() {
    // Re-runs the server-side query whenever the shared header search box changes.
    effect(() => {
      this.pageSearch.term();
      if (this.isFirstSearchEffect) {
        this.isFirstSearchEffect = false;
        return;
      }
      clearTimeout(this.searchDebounce);
      this.searchDebounce = setTimeout(() => {
        this.page.set(1);
        this.loadBodies();
      }, 250);
    });
  }

  ngOnInit(): void {
    this.pageSearch.title.set('Sport Management');
    this.pageSearch.reset();
    const id = this.route.snapshot.paramMap.get('sportId')!;
    this.sportId.set(id);
    this.loadSport();
    this.loadBodies();
  }

  canWrite(): boolean {
    return this.auth.canWriteCatalogue();
  }

  get crumbs(): Crumb[] {
    return [
      { label: 'Sport', link: ['/sports'] },
      { label: this.sport()?.name || '…' }
    ];
  }

  private loadSport(): void {
    this.sportsService.get(this.sportId()).subscribe({
      next: (s) => this.sport.set(s),
      error: () => this.sport.set(null)
    });
  }

  loadBodies(): void {
    this.loading.set(true);
    this.bodiesError.set('');
    this.orgTree
      .listGoverningBodies(this.sportId(), {
        search: this.pageSearch.term() || undefined,
        page: this.page(),
        limit: this.limit
      })
      .subscribe({
        next: (res) => {
          this.bodies.set(res.data);
          this.total.set(res.meta.total);
          this.totalPages.set(res.meta.totalPages ?? Math.max(1, Math.ceil(res.meta.total / this.limit)));
          this.loading.set(false);
        },
        error: (err) => {
          this.bodiesError.set(
            err.status === 403
              ? 'You do not have permission to view governing bodies.'
              : 'Could not load governing bodies. Please retry.'
          );
          this.loading.set(false);
        }
      });
  }

  goToPage(delta: number): void {
    const next = this.page() + delta;
    if (next < 1 || next > this.totalPages()) return;
    this.page.set(next);
    this.loadBodies();
  }

  openBody(body: GoverningBody): void {
    this.router.navigate(['/sports', this.sportId(), 'bodies', body.id]);
  }

  openAddDialog(): void {
    this.formError.set('');
    this.formFieldErrors.set({});
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  saveBody(value: Record<string, unknown>): void {
    this.savingForm.set(true);
    this.formError.set('');
    this.formFieldErrors.set({});
    this.orgTree
      .createGoverningBody(this.sportId(), {
        name: String(value['name'] ?? '').trim(),
        description: value['description'] ? String(value['description']) : undefined,
        iconUrl: value['iconUrl'] ? String(value['iconUrl']) : undefined
      })
      .subscribe({
        next: () => {
          this.savingForm.set(false);
          this.showAddDialog.set(false);
          this.loadBodies();
        },
        error: (err) => {
          this.savingForm.set(false);
          if (err.status === 409) {
            this.formFieldErrors.set({ name: 'A governing body with this name already exists.' });
          } else if (err.status === 403) {
            this.formError.set('You do not have permission to do this (needs admin or operator).');
          } else {
            this.formError.set('Something went wrong. Please try again.');
          }
        }
      });
  }

  askDelete(body: GoverningBody, evt: Event): void {
    evt.stopPropagation();
    this.deletingBody.set(body);
  }

  cancelDelete(): void {
    this.deletingBody.set(null);
  }

  confirmDelete(): void {
    const body = this.deletingBody();
    if (!body) return;
    this.deleteLoading.set(true);
    this.orgTree.deleteGoverningBody(body.id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.deletingBody.set(null);
        this.loadBodies();
      },
      error: (err) => {
        this.deleteLoading.set(false);
        this.deletingBody.set(null);
        this.bodiesError.set(err.status === 403 ? 'You do not have permission to delete this.' : 'Could not delete this governing body.');
      }
    });
  }
}
