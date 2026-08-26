import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';

import { SportsService } from '../../../../core/services/sports.service';
import { Sport } from '../../../../shared/models/sport.model';

import {
  SportFormComponent,
  SportFormDialogData
} from '../../../../shared/dialogs/sport-form/sport-form.component';

@Component({
  selector: 'app-sports-list',
  standalone: true,

  imports: [
    MatDialogModule
  ],

  templateUrl: './sports-list.component.html',
  styleUrl: './sports-list.component.scss',

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SportsListComponent implements OnInit {

  // ---------------------------------------------------------
  // Dependencies
  // ---------------------------------------------------------

  private readonly sportsService = inject(SportsService);


  private readonly destroyRef = inject(DestroyRef);

  private readonly dialog = inject(MatDialog);


  // ---------------------------------------------------------
  // Sports state
  // ---------------------------------------------------------

  readonly sports = signal<Sport[]>([]);

  readonly loading = signal(false);

  readonly error = signal<string | null>(null);

  readonly search = signal('');

  readonly page = signal(1);

  readonly limit = signal(10);

  readonly total = signal(0);

  readonly totalPages = signal(1);


  // ---------------------------------------------------------
  // Statistics state
  // ---------------------------------------------------------

  readonly governingBodiesTotal = signal(0);

  readonly organizationsTotal = signal(0);

  readonly participantsTotal = signal(0);

  readonly statsLoading = signal(false);

  readonly statsError = signal<string | null>(null);


  // ---------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------

  ngOnInit(): void {
    this.loadSports();
    this.loadStats();
  }


  // ---------------------------------------------------------
  // GET SPORTS
  // ---------------------------------------------------------

  loadSports(): void {

    this.loading.set(true);

    this.error.set(null);

    this.sportsService
      .getSports(
        this.search(),
        this.page(),
        this.limit()
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({

        next: (response) => {

          this.sports.set(
            response.data ?? []
          );

          this.total.set(
            response.meta?.total ?? 0
          );

          this.totalPages.set(
            response.meta?.totalPages ?? 1
          );
        },

        error: (err) => {

          console.error(
            'Failed to load sports',
            err
          );

          this.error.set(
            err?.error?.error?.message ??
            'Unable to load sports.'
          );
        }

      });
  }


  // ---------------------------------------------------------
  // GET SPORTS STATISTICS
  // ---------------------------------------------------------

  loadStats(): void {

    this.statsLoading.set(true);
  
    this.statsError.set(null);
  
    forkJoin({
  
      governingBodies:
        this.sportsService.getGoverningBodiesTotal(),
  
      organizations:
        this.sportsService.getOrganizationsTotal(),
  
      players:
        this.sportsService.getPlayersTotal()
  
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
  
        finalize(() => {
          this.statsLoading.set(false);
        })
      )
      .subscribe({
  
        next: (response) => {
  
          this.governingBodiesTotal.set(
            response.governingBodies.meta?.total ?? 0
          );
  
          this.organizationsTotal.set(
            response.organizations.meta?.total ?? 0
          );
  
          this.participantsTotal.set(
            response.players.meta?.total ?? 0
          );
        },
  
        error: (err) => {
  
          console.error(
            'Failed to load sports statistics',
            err
          );
  
          this.statsError.set(
            err?.error?.error?.message ??
            'Unable to load statistics.'
          );
        }
  
      });
  }
  


  // ---------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------

  onSearch(value: string): void {

    this.search.set(value);

    this.page.set(1);

    this.loadSports();
  }


  // ---------------------------------------------------------
  // PAGINATION
  // ---------------------------------------------------------

  previousPage(): void {

    if (this.page() <= 1) {
      return;
    }

    this.page.update(
      page => page - 1
    );

    this.loadSports();
  }


  nextPage(): void {

    if (this.page() >= this.totalPages()) {
      return;
    }

    this.page.update(
      page => page + 1
    );

    this.loadSports();
  }


  // ---------------------------------------------------------
  // CREATE SPORT
  // ---------------------------------------------------------

  openCreateDialog(): void {

    const dialogRef = this.dialog.open(
      SportFormComponent,
      {
        data: {},
        panelClass: 'buzzer-dialog'
      }
    );

    dialogRef
      .afterClosed()

      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )

      .subscribe((payload) => {

        if (!payload) {
          return;
        }

        this.loading.set(true);

        this.sportsService
          .createSport(payload)

          .pipe(
            takeUntilDestroyed(this.destroyRef),

            finalize(() => {
              this.loading.set(false);
            })
          )

          .subscribe({

            next: () => {

              // Start from first page after creation.
              this.page.set(1);

              this.loadSports();

              // Refresh total statistics.
              this.loadStats();
            },

            error: (err) => {

              console.error(
                'Failed to create sport',
                err
              );

              this.error.set(
                err?.error?.error?.message ??
                'Unable to create sport.'
              );
            }

          });
      });
  }


  // ---------------------------------------------------------
  // EDIT SPORT
  // ---------------------------------------------------------

  openEditDialog(sport: Sport): void {

    const dialogRef = this.dialog.open(
      SportFormComponent,
      {
        data: {
          sport
        } satisfies SportFormDialogData,

        panelClass: 'buzzer-dialog'
      }
    );

    dialogRef
      .afterClosed()

      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )

      .subscribe((payload) => {

        if (!payload) {
          return;
        }

        this.loading.set(true);

        this.sportsService
          .updateSport(
            sport.id,
            payload
          )

          .pipe(
            takeUntilDestroyed(this.destroyRef),

            finalize(() => {
              this.loading.set(false);
            })
          )

          .subscribe({

            next: () => {
              this.loadSports();
            },

            error: (err) => {

              console.error(
                'Failed to update sport',
                err
              );

              this.error.set(
                err?.error?.error?.message ??
                'Unable to update sport.'
              );
            }

          });
      });
  }


  // ---------------------------------------------------------
  // DELETE SPORT
  // ---------------------------------------------------------

  deleteSport(sport: Sport): void {

    const confirmed = window.confirm(
      `Delete "${sport.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.loading.set(true);

    this.sportsService
      .deleteSport(sport.id)

      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.loading.set(false);
        })
      )

      .subscribe({

        next: () => {

          /*
           * If the deleted item was the only item
           * on the current page, move back one page.
           */
          if (
            this.sports().length === 1 &&
            this.page() > 1
          ) {
            this.page.update(
              page => page - 1
            );
          }

          this.loadSports();

          // Refresh statistics after deletion.
          this.loadStats();
        },

        error: (err) => {

          console.error(
            'Failed to delete sport',
            err
          );

          this.error.set(
            err?.error?.error?.message ??
            'Unable to delete sport.'
          );
        }

      });
  }
}
