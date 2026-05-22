export type LoanStatus = "ACTIVE" | "CLOSED" | "INACTIVE";
export type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER";

export interface Customer {
  id: number;
  full_name: string;
  guardian_name: string;
  phone_number: string;
  address: string;
  created_at: string;
}

export interface Loan {
  id: number;
  customer: number;
  customer_name?: string;
  loan_amount: string | number;
  interest_rate: string | number;
  gold_weight: string | number;
  gold_description: string;
  status: LoanStatus;
  issued_date: string;
  closed_date: string | null;
  outstanding_balance: string | number;
  total_paid: string | number;
}

export interface Payment {
  id: number;
  loan: number;
  loan_id?: number;
  customer_name?: string;
  amount: string | number;
  payment_method: PaymentMethod;
  payment_date: string;
  notes?: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardStats {
  total_customers: number;
  total_active_loans: number;
  total_closed_loans: number;
  total_outstanding_amount: number | string;
  recent_payments: Payment[];
  recent_loans: Loan[];
}