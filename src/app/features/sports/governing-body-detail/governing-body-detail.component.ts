import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PageSearchService } from '../../../core/services/page-search.service';
import { SportsService } from '../../../core/services/sports.service';
import { OrganizationTreeService } from '../../../core/services/organization.service';
import { GoverningBody, Organisation, Sport } from '../../../core/models/api.model';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BreadcrumbsComponent, Crumb } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EntityField, EntityFormDialogComponent } from '../../../shared/components/entity-form-dialog/entity-form-dialog.component';

@Component({
  selector: 'app-governing-body-detail',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    IconComponent,
    BreadcrumbsComponent,
    ConfirmDialogComponent,
    EntityFormDialogComponent
  ],
  templateUrl: './governing-body-detail.component.html',
  styleUrl: './governing-body-detail.component.scss'
})
export class GoverningBodyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sportsService = inject(SportsService);
  private readonly orgTree = inject(OrganizationTreeService);
  private readonly auth = inject(AuthService);
  readonly pageSearch = inject(PageSearchService);

  readonly sportId = signal('');
  readonly bodyId = signal('');
  readonly sport = signal<Sport | null>(null);
  readonly body = signal<GoverningBody | null>(null);
  readonly organisations = signal<Organisation[]>([]);
  readonly loading = signal(true);
  readonly listError = signal('');
  readonly page = signal(1);
  readonly limit = 12;
  readonly totalPages = signal(1);
  readonly total = signal(0);

  readonly showAddDialog = signal(false);
  readonly savingForm = signal(false);
  readonly formError = signal('');
  readonly formFieldErrors = signal<Record<string, string>>({});
  readonly deletingOrg = signal<Organisation | null>(null);
  readonly deleteLoading = signal(false);

  readonly orgFields: EntityField[] = [
    { key: 'name', label: 'Organisation Name', placeholder: 'e.g. English Premier League', required: true },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description' },
    { key: 'crestUrl', label: 'Crest / Logo URL', type: 'url', placeholder: 'https://…/crest.png' }
  ];

  private isFirstSearchEffect = true;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      this.pageSearch.term();
      if (this.isFirstSearchEffect) {
        this.isFirstSearchEffect = false;
        return;
      }
      clearTimeout(this.searchDebounce);
      this.searchDebounce = setTimeout(() => {
        this.page.set(1);
        this.loadOrganisations();
      }, 250);
    });
  }

  ngOnInit(): void {
    this.pageSearch.title.set('Sport Management');
    this.pageSearch.reset();
    this.sportId.set(this.route.snapshot.paramMap.get('sportId')!);
    this.bodyId.set(this.route.snapshot.paramMap.get('bodyId')!);
    this.sportsService.get(this.sportId()).subscribe({ next: (s) => this.sport.set(s) });
    this.orgTree.getGoverningBody(this.bodyId()).subscribe({ next: (b) => this.body.set(b) });
    this.loadOrganisations();
  }

  canWrite(): boolean {
    return this.auth.canWriteCatalogue();
  }

  get crumbs(): Crumb[] {
    return [
      { label: 'Sport', link: ['/sports'] },
      { label: this.sport()?.name || '…', link: ['/sports', this.sportId()] },
      { label: this.body()?.name || '…' }
    ];
  }

  loadOrganisations(): void {
    this.loading.set(true);
    this.listError.set('');
    this.orgTree
      .listOrganisations(this.bodyId(), {
        search: this.pageSearch.term() || undefined,
        page: this.page(),
        limit: this.limit
      })
      .subscribe({
        next: (res) => {
          this.organisations.set(res.data);
          this.total.set(res.meta.total);
          this.totalPages.set(res.meta.totalPages ?? Math.max(1, Math.ceil(res.meta.total / this.limit)));
          this.loading.set(false);
        },
        error: (err) => {
          this.listError.set(
            err.status === 403
              ? 'You do not have permission to view organisations.'
              : 'Could not load organisations for this governing body.'
          );
          this.loading.set(false);
        }
      });
  }

  goToPage(delta: number): void {
    const next = this.page() + delta;
    if (next < 1 || next > this.totalPages()) return;
    this.page.set(next);
    this.loadOrganisations();
  }

  openOrg(org: Organisation): void {
    this.router.navigate(['/sports', this.sportId(), 'bodies', this.bodyId(), 'orgs', org.id]);
  }

  openAddDialog(): void {
    this.formError.set('');
    this.formFieldErrors.set({});
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  saveOrg(value: Record<string, unknown>): void {
    this.savingForm.set(true);
    this.formError.set('');
    this.formFieldErrors.set({});
    this.orgTree
      .createOrganisation(this.bodyId(), {
        name: String(value['name'] ?? '').trim(),
        description: value['description'] ? String(value['description']) : undefined,
        crestUrl: value['crestUrl'] ? String(value['crestUrl']) : undefined
      })
      .subscribe({
        next: () => {
          this.savingForm.set(false);
          this.showAddDialog.set(false);
          this.loadOrganisations();
        },
        error: (err) => {
          this.savingForm.set(false);
          if (err.status === 409) {
            this.formFieldErrors.set({ name: 'An organisation with this name already exists.' });
          } else if (err.status === 403) {
            this.formError.set('You do not have permission to do this (needs admin or operator).');
          } else {
            this.formError.set('Something went wrong. Please try again.');
          }
        }
      });
  }

  askDelete(org: Organisation, evt: Event): void {
    evt.stopPropagation();
    this.deletingOrg.set(org);
  }

  cancelDelete(): void {
    this.deletingOrg.set(null);
  }

  confirmDelete(): void {
    const org = this.deletingOrg();
    if (!org) return;
    this.deleteLoading.set(true);
    this.orgTree.deleteOrganisation(org.id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.deletingOrg.set(null);
        this.loadOrganisations();
      },
      error: (err) => {
        this.deleteLoading.set(false);
        this.deletingOrg.set(null);
        this.listError.set(err.status === 403 ? 'You do not have permission to delete this.' : 'Could not delete this organisation.');
      }
    });
  }
}
