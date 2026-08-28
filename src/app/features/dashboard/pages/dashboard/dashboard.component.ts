import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DashboardService } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  private readonly dashboardService = inject(DashboardService);

  loading = true;
  error = '';

  revenue: any = null;
  matches: any = null;
  users: any = null;
  engagement: any = null;
  paymentSummary: any = null;

  recentMatches: any[] = [];
  recentTransactions: any[] = [];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.revenue = data.revenue;
        this.matches = data.matches;
        this.users = data.users;
        this.engagement = data.engagement;
        this.paymentSummary = data.paymentSummary;

        this.recentMatches =
          this.extractArray(data.recentMatches);

        this.recentTransactions =
          this.extractArray(data.recentTransactions);

        this.loading = false;
      },

      error: (err) => {
        console.error('Dashboard load failed', err);

        this.error =
          'Unable to load dashboard data.';

        this.loading = false;
      }
    });
  }

  private extractArray(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.items)) {
      return response.data.items;
    }

    if (Array.isArray(response?.items)) {
      return response.items;
    }

    return [];
  }

  getRevenue(): number {
    const data =
      this.paymentSummary?.data ??
      this.paymentSummary;

    return Number(
      data?.grossRevenue ??
      data?.revenue ??
      data?.totalRevenue ??
      0
    );
  }

  getCompleted(): number {
    const data =
      this.paymentSummary?.data ??
      this.paymentSummary;

    return Number(
      data?.completed ??
      data?.completedCount ??
      data?.counts?.COMPLETED ??
      0
    );
  }

  getPending(): number {
    const data =
      this.paymentSummary?.data ??
      this.paymentSummary;

    return Number(
      data?.pending ??
      data?.pendingCount ??
      data?.counts?.PENDING ??
      0
    );
  }

  getFailed(): number {
    const data =
      this.paymentSummary?.data ??
      this.paymentSummary;

    return Number(
      data?.failed ??
      data?.failedCount ??
      data?.counts?.FAILED ??
      0
    );
  }

  getMatchCount(): number {
    return this.getTotal(this.matches);
  }

  getUserCount(): number {
    return this.getTotal(this.users);
  }

  getEngagementCount(): number {
    return this.getTotal(this.engagement);
  }

  private getTotal(response: any): number {
    const data = response?.data ?? response;

    return Number(
      data?.total ??
      data?.count ??
      response?.meta?.total ??
      0
    );
  }
}