import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PageSearchService } from '../../../core/services/page-search.service';
import { SportsService } from '../../../core/services/sports.service';
import { OrganizationTreeService } from '../../../core/services/organization.service';
import { GoverningBody, Organisation, Player, Sport, Team } from '../../../core/models/api.model';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BreadcrumbsComponent, Crumb } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EntityField, EntityFormDialogComponent } from '../../../shared/components/entity-form-dialog/entity-form-dialog.component';

/**
 * Bottom of the drill-down tree: Sport -> Governing Body -> Organisation -> Team -> Player.
 * Players here are the catalogue-level "participant" records (`/api/organizations/players`),
 * distinct from the Organisation's Squad tab (`/api/organizations/:id/squad`), which is the
 * roster-facing view of participants tied to real athlete profiles.
 */
@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    IconComponent,
    BreadcrumbsComponent,
    ConfirmDialogComponent,
    EntityFormDialogComponent
  ],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.scss'
})
export class TeamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sportsService = inject(SportsService);
  private readonly orgTree = inject(OrganizationTreeService);
  private readonly auth = inject(AuthService);
  readonly pageSearch = inject(PageSearchService);

  readonly sportId = signal('');
  readonly bodyId = signal('');
  readonly orgId = signal('');
  readonly teamId = signal('');

  readonly sport = signal<Sport | null>(null);
  readonly body = signal<GoverningBody | null>(null);
  readonly organisation = signal<Organisation | null>(null);
  readonly team = signal<Team | null>(null);

  readonly players = signal<Player[]>([]);
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
  readonly deletingPlayer = signal<Player | null>(null);
  readonly deleteLoading = signal(false);

  readonly playerFields: EntityField[] = [
    { key: 'name', label: 'Player Name', placeholder: 'e.g. Erling Haaland', required: true },
    { key: 'position', label: 'Position', placeholder: 'e.g. Forward' },
    { key: 'photoUrl', label: 'Photo URL', type: 'url', placeholder: 'https://…/photo.jpg' }
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
        this.loadPlayers();
      }, 250);
    });
  }

  ngOnInit(): void {
    this.pageSearch.title.set('Sport Management');
    this.pageSearch.reset();
    this.sportId.set(this.route.snapshot.paramMap.get('sportId')!);
    this.bodyId.set(this.route.snapshot.paramMap.get('bodyId')!);
    this.orgId.set(this.route.snapshot.paramMap.get('orgId')!);
    this.teamId.set(this.route.snapshot.paramMap.get('teamId')!);

    this.sportsService.get(this.sportId()).subscribe({ next: (s) => this.sport.set(s) });
    this.orgTree.getGoverningBody(this.bodyId()).subscribe({ next: (b) => this.body.set(b) });
    this.orgTree.getOrganisation(this.orgId()).subscribe({ next: (o) => this.organisation.set(o) });
    this.orgTree.getTeam(this.teamId()).subscribe({ next: (t) => this.team.set(t) });

    this.loadPlayers();
  }

  canWrite(): boolean {
    return this.auth.canWriteCatalogue();
  }

  get crumbs(): Crumb[] {
    return [
      { label: 'Sport', link: ['/sports'] },
      { label: this.sport()?.name || '…', link: ['/sports', this.sportId()] },
      { label: this.body()?.name || '…', link: ['/sports', this.sportId(), 'bodies', this.bodyId()] },
      { label: this.organisation()?.name || '…', link: ['/sports', this.sportId(), 'bodies', this.bodyId(), 'orgs', this.orgId()] },
      { label: this.team()?.name || '…' }
    ];
  }

  loadPlayers(): void {
    this.loading.set(true);
    this.listError.set('');
    this.orgTree
      .listPlayers(this.teamId(), {
        search: this.pageSearch.term() || undefined,
        page: this.page(),
        limit: this.limit
      })
      .subscribe({
        next: (res) => {
          this.players.set(res.data);
          this.total.set(res.meta.total);
          this.totalPages.set(res.meta.totalPages ?? Math.max(1, Math.ceil(res.meta.total / this.limit)));
          this.loading.set(false);
        },
        error: (err) => {
          this.listError.set(err.status === 403 ? 'You do not have permission to view players.' : 'Could not load players.');
          this.loading.set(false);
        }
      });
  }

  goToPage(delta: number): void {
    const next = this.page() + delta;
    if (next < 1 || next > this.totalPages()) return;
    this.page.set(next);
    this.loadPlayers();
  }

  openAddDialog(): void {
    this.formError.set('');
    this.formFieldErrors.set({});
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  savePlayer(value: Record<string, unknown>): void {
    this.savingForm.set(true);
    this.formError.set('');
    this.formFieldErrors.set({});
    this.orgTree
      .createPlayer(this.teamId(), {
        name: String(value['name'] ?? '').trim(),
        position: value['position'] ? String(value['position']) : undefined,
        photoUrl: value['photoUrl'] ? String(value['photoUrl']) : undefined
      })
      .subscribe({
        next: () => {
          this.savingForm.set(false);
          this.showAddDialog.set(false);
          this.loadPlayers();
        },
        error: (err) => {
          this.savingForm.set(false);
          if (err.status === 409) {
            this.formFieldErrors.set({ name: 'A player with this name already exists on this team.' });
          } else if (err.status === 403) {
            this.formError.set('You do not have permission to do this (needs admin or operator).');
          } else {
            this.formError.set('Something went wrong. Please try again.');
          }
        }
      });
  }

  askDelete(player: Player, evt: Event): void {
    evt.stopPropagation();
    this.deletingPlayer.set(player);
  }

  cancelDelete(): void {
    this.deletingPlayer.set(null);
  }

  confirmDelete(): void {
    const player = this.deletingPlayer();
    if (!player) return;
    this.deleteLoading.set(true);
    this.orgTree.deletePlayer(player.id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.deletingPlayer.set(null);
        this.loadPlayers();
      },
      error: (err) => {
        this.deleteLoading.set(false);
        this.deletingPlayer.set(null);
        this.listError.set(err.status === 403 ? 'You do not have permission to delete this.' : 'Could not delete this player.');
      }
    });
  }
}
