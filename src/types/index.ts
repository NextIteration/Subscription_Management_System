export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  company?: string;
  customerId?: string; // If customer role, links to customer record
  password?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  taxNumber?: string;
  status: 'active' | 'inactive';
  totalSpent: number;
  activeSubscriptionsCount: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  priceAdjustment: number;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'Software License' | 'Cloud Service' | 'API Access' | 'Support & Service';
  salesPrice: number;
  costPrice: number;
  notes: string;
  status: 'active' | 'archived';
  variants: ProductVariant[];
}

export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Plan {
  id: string;
  name: string;
  code: string;
  billingFrequency: BillingFrequency;
  minimumQuantity: number;
  price: number;
  availableFrom: string;
  availableUntil: string;
  autoRenewDefault: boolean;
  earlyClosurePenaltyPercentage: number;
  pauseAllowed: boolean;
  maxPauseDays: number;
  description: string;
  status: 'active' | 'archived';
}

export interface LineItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  description: string;
  planId: string;
  defaultLines: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  validityDays: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  templateId?: string;
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'rejected';
  validUntil: string;
  lines: LineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export type SubscriptionStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED';

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  planId: string;
  planName: string;
  billingFrequency: BillingFrequency;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
  nextBillingDate: string;
  paymentTerms: 'IMMEDIATE' | 'NET15' | 'NET30' | 'NET60';
  lines: LineItem[];
  taxReference: string;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  pauseReason?: string;
  pausedAt?: string;
  pauseDaysRemaining?: number;
  autoRenew: boolean;
  renewalNotificationDays: number;
  closedAt?: string;
  closureReason?: string;
  createdAt: string;
}

export interface TaxRule {
  id: string;
  name: string;
  code: string;
  ratePercentage: number;
  country: string;
  state?: string;
  description: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
}

export interface DiscountRule {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  usedCount: number;
  status: 'active' | 'expired' | 'disabled';
  applicablePlanIds?: string[];
  applicableProducts?: { id: string; product: { id: string; name: string } }[];
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'voided' | 'DRAFT' | 'CONFIRMED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId?: string;
  subscriptionNumber?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lines: LineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentTerms: string;
  notes?: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'ACH' | 'Stripe' | string;
  paymentDate: string;
  reference: string;
  status: 'completed' | 'processing' | 'failed' | string;
  notes?: string;
}

export interface FinancialMetric {
  totalRevenue: number;
  totalBilled?: number;
  mrr: number;
  arr: number;
  totalOutstanding: number;
  totalOverdue: number;
  activeSubscriptionsCount: number;
  overdueInvoicesCount: number;
  newClientsThisMonth?: number;
  collectionRate: number;
}
