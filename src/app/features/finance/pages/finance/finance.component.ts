import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FinanceService } from '../../../../core/services/finance.service';
import {
  PaymentTransaction,
  PaymentStatus
} from '../../../../shared/models/payment.model';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.scss'
})
export class FinanceComponent implements OnInit {

  private readonly financeService = inject(FinanceService);

  transactions: PaymentTransaction[] = [];

  loading = false;
  error = '';

  search = '';
  status: PaymentStatus | '' = '';
  currency = '';

  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;

  summary = {
    grossRevenue: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    cancelled: 0
  };

  readonly statuses: PaymentStatus[] = [
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'CANCELLED'
  ];

  ngOnInit(): void {
    this.loadSummary();
    this.loadTransactions();
  }

  loadSummary(): void {
    this.financeService.getSummary().subscribe({
      next: (response: any) => {
        const data = response?.data ?? response ?? {};

        this.summary = {
          grossRevenue: this.number(
            data.grossRevenue ??
            data.gross ??
            data.revenue ??
            data.totalRevenue
          ),

          completed: this.number(
            data.completed ??
            data.completedCount ??
            data.counts?.COMPLETED ??
            data.counts?.completed
          ),

          pending: this.number(
            data.pending ??
            data.pendingCount ??
            data.counts?.PENDING ??
            data.counts?.pending
          ),

          failed: this.number(
            data.failed ??
            data.failedCount ??
            data.counts?.FAILED ??
            data.counts?.failed
          ),

          refunded: this.number(
            data.refunded ??
            data.refundedCount ??
            data.counts?.REFUNDED ??
            data.counts?.refunded
          ),

          cancelled: this.number(
            data.cancelled ??
            data.cancelledCount ??
            data.counts?.CANCELLED ??
            data.counts?.cancelled
          )
        };
      },

      error: (err) => {
        console.error('Payment summary error:', err);
      }
    });
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = '';

    this.financeService.getTransactions(
      this.search,
      this.status || undefined,
      this.currency || undefined,
      this.page,
      this.limit
    ).subscribe({
      next: (response: any) => {

        this.transactions = response?.data ?? [];

        this.total = response?.meta?.total ?? 0;
        this.totalPages = response?.meta?.totalPages ?? 1;

        this.loading = false;
      },

      error: (err) => {
        console.error('Payment transactions error:', err);

        this.transactions = [];
        this.error =
          err?.error?.error?.message ||
          'Unable to load transactions.';

        this.loading = false;
      }
    });
  }

  searchTransactions(): void {
    this.page = 1;
    this.loadTransactions();
  }

  clearFilters(): void {
    this.search = '';
    this.status = '';
    this.currency = '';
    this.page = 1;

    this.loadTransactions();
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadTransactions();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadTransactions();
    }
  }

  formatAmount(transaction: any): string {
    const amount = Number(
      transaction?.amount ??
      transaction?.total ??
      transaction?.value ??
      0
    );

    const currency =
      transaction?.currency || 'USD';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';

    return new Date(date).toLocaleDateString(
      'en-US',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  }

  customerName(transaction: any): string {
    return (
      transaction?.customerName ||
      transaction?.customer?.name ||
      transaction?.customer ||
      transaction?.email ||
      '-'
    );
  }

  transactionReference(transaction: any): string {
    return (
      transaction?.reference ||
      transaction?.referenceId ||
      transaction?.transactionReference ||
      transaction?.id ||
      '-'
    );
  }

  statusClass(status: string): string {
    return String(status || '')
      .toLowerCase();
  }

  private number(value: unknown): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  }
}
