import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  PaymentTransaction,
  PaymentsResponse,
  PaymentSummary,
  PaymentStatus
} from '../../shared/models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${environment.apiUrl}/api/payments`;

    getTransactions(
      search = '',
      status?: PaymentStatus,
      currency?: string,
      page = 1,
      limit = 10
    ): Observable<PaymentsResponse> {
    
      let params = new HttpParams()
        .set('page', page)
        .set('limit', limit)
        .set('sortOrder', 'desc');
    
      if (search.trim()) {
        params = params.set('search', search.trim());
      }
    
      if (status) {
        params = params.set('status', status);
      }
    
      if (currency) {
        params = params.set('currency', currency);
      }
    
      return this.http.get<PaymentsResponse>(
        `${this.endpoint}/transactions`,
        { params }
      );
    }
    

  getSummary(): Observable<PaymentSummary> {
    return this.http.get<PaymentSummary>(
      `${this.endpoint}/summary`
    );
  }

  getTransaction(id: string): Observable<PaymentTransaction> {
    return this.http.get<PaymentTransaction>(
      `${this.endpoint}/transactions/${id}`
    );
  }

  updateStatus(
    id: string,
    status: PaymentStatus
  ): Observable<unknown> {
    return this.http.patch(
      `${this.endpoint}/transactions/${id}/status`,
      { status }
    );
  }
}

