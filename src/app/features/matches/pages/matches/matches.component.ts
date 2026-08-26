// import {
//   ChangeDetectionStrategy,
//   Component,
//   DestroyRef,
//   OnInit,
//   inject,
//   signal
// } from '@angular/core';

// import { CommonModule } from '@angular/common';

// import {
//   takeUntilDestroyed
// } from '@angular/core/rxjs-interop';

// import {
//   finalize
// } from 'rxjs';

// import {
//   MatchesService
// } from '../../../../core/services/matches.service';

// import {
//   Match,
//   MatchStatus
// } from '../../../../shared/models/match.model';

// @Component({
//   selector: 'app-matches',
//   standalone: true,

//   imports: [
//     CommonModule
//   ],

//   templateUrl: './matches.component.html',
//   styleUrl: './matches.component.scss',

//   changeDetection: ChangeDetectionStrategy.OnPush
// })

// export class MatchesComponent implements OnInit {

//   private readonly matchesService =
//     inject(MatchesService);

//   private readonly destroyRef =
//     inject(DestroyRef);


//   // =========================================================
//   // STATE
//   // =========================================================

//   readonly matches =
//     signal<Match[]>([]);

//   readonly loading =
//     signal(false);

//   readonly error =
//     signal<string | null>(null);

//   readonly search =
//     signal('');

//   readonly status =
//     signal<MatchStatus | ''>('');

//   readonly page =
//     signal(1);

//   readonly limit =
//     signal(10);

//   readonly total =
//     signal(0);

//   readonly totalPages =
//     signal(1);


//   // =========================================================
//   // LIFECYCLE
//   // =========================================================

//   ngOnInit(): void {
//     this.loadMatches();
//   }


//   // =========================================================
//   // LOAD
//   // =========================================================

//   loadMatches(): void {

//     this.loading.set(true);

//     this.error.set(null);

//     this.matchesService
//       .getMatches(
//         this.search(),
//         this.status() || undefined,
//         this.page(),
//         this.limit()
//       )

//       .pipe(
//         takeUntilDestroyed(
//           this.destroyRef
//         ),

//         finalize(() => {
//           this.loading.set(false);
//         })
//       )

//       .subscribe({

//         next: (response) => {

//           this.matches.set(
//             response.data ?? []
//           );

//           this.total.set(
//             response.meta?.total ?? 0
//           );

//           this.totalPages.set(
//             response.meta?.totalPages ?? 1
//           );
//         },

//         error: (err) => {

//           console.error(
//             'Failed to load matches',
//             err
//           );

//           this.error.set(
//             err?.error?.error?.message ??
//             'Unable to load matches.'
//           );
//         }

//       });
//   }


//   // =========================================================
//   // SEARCH
//   // =========================================================

//   onSearch(
//     value: string
//   ): void {

//     this.search.set(value);

//     this.page.set(1);

//     this.loadMatches();
//   }


//   // =========================================================
//   // STATUS FILTER
//   // =========================================================

//   onStatusChange(
//     value: string
//   ): void {

//     this.status.set(
//       value as MatchStatus | ''
//     );

//     this.page.set(1);

//     this.loadMatches();
//   }


//   // =========================================================
//   // PAGINATION
//   // =========================================================

//   previousPage(): void {

//     if (this.page() <= 1) {
//       return;
//     }

//     this.page.update(
//       page => page - 1
//     );

//     this.loadMatches();
//   }


//   nextPage(): void {

//     if (
//       this.page() >=
//       this.totalPages()
//     ) {
//       return;
//     }

//     this.page.update(
//       page => page + 1
//     );

//     this.loadMatches();
//   }


//   // =========================================================
//   // STATUS LABEL
//   // =========================================================

//   statusLabel(
//     status: MatchStatus
//   ): string {

//     return status;
//   }

// }
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { DatePipe } from '@angular/common';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  finalize
} from 'rxjs';

import {
  MatchesService
} from '../../../../core/services/matches.service';

import {
  Match,
  MatchStatus
} from '../../../../shared/models/match.model';

@Component({
  selector: 'app-matches',
  standalone: true,

  imports: [
    DatePipe
  ],

  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss',

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchesComponent implements OnInit {

  private readonly matchesService =
    inject(MatchesService);

  private readonly destroyRef =
    inject(DestroyRef);


  // =========================================================
  // STATE
  // =========================================================

  readonly matches =
    signal<Match[]>([]);

  readonly loading =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly search =
    signal('');

  readonly status =
    signal<MatchStatus | ''>('');

  readonly page =
    signal(1);

  readonly limit =
    signal(10);

  readonly total =
    signal(0);

  readonly totalPages =
    signal(1);


  // =========================================================
  // LIFECYCLE
  // =========================================================

  ngOnInit(): void {
    this.loadMatches();
  }


  // =========================================================
  // LOAD MATCHES
  // =========================================================

  loadMatches(): void {

    this.loading.set(true);

    this.error.set(null);

    this.matchesService
      .getMatches(
        this.search(),
        this.status() || undefined,
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

          this.matches.set(
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
            'Failed to load matches',
            err
          );

          this.error.set(
            err?.error?.error?.message ??
            'Unable to load matches.'
          );

        }

      });

  }


  // =========================================================
  // SEARCH
  // =========================================================

  onSearch(
    value: string
  ): void {

    this.search.set(value);

    this.page.set(1);

    this.loadMatches();

  }


  // =========================================================
  // STATUS FILTER
  // =========================================================

  onStatusChange(
    value: string
  ): void {

    this.status.set(
      value as MatchStatus | ''
    );

    this.page.set(1);

    this.loadMatches();

  }


  // =========================================================
  // PAGINATION
  // =========================================================

  previousPage(): void {

    if (this.page() <= 1) {
      return;
    }

    this.page.update(
      page => page - 1
    );

    this.loadMatches();

  }


  nextPage(): void {

    if (this.page() >= this.totalPages()) {
      return;
    }

    this.page.update(
      page => page + 1
    );

    this.loadMatches();

  }


  // =========================================================
  // STATUS LABEL
  // =========================================================

  statusLabel(
    status: MatchStatus
  ): string {

    switch (status) {

      case 'SCHEDULED':
        return 'Scheduled';

      case 'LIVE':
        return 'Live';

      case 'FINISHED':
        return 'Finished';

      case 'CANCELLED':
        return 'Cancelled';

      default:
        return status;

    }

  }

}
