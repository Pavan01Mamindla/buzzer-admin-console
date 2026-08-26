export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface PaymentTransaction {
  id: string;
  reference?: string;
  customer?: string;
  customerName?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentsResponse {
  success: boolean;
  data: PaymentTransaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaymentSummary {
  success: boolean;
  data: {
    pending?: number;
    completed?: number;
    failed?: number;
    refunded?: number;
    cancelled?: number;
    grossRevenue?: number;
    [key: string]: unknown;
  };
}
