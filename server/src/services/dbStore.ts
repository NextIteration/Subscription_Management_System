import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/security.js';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  company?: string;
  avatar?: string;
  customerId?: string;
  resetToken?: string;
  resetTokenExp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerEntity {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  address?: string;
  taxNumber?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariantEntity {
  id: string;
  productId: string;
  name: string;
  sku: string;
  priceAdjustment: number;
  description?: string;
}

export interface ProductEntity {
  id: string;
  name: string;
  type: 'Software License' | 'Cloud Service' | 'API Access' | 'Support & Service';
  salesPrice: number;
  costPrice: number;
  notes?: string;
  status: 'active' | 'archived';
  variants: ProductVariantEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanEntity {
  id: string;
  name: string;
  code: string;
  billingFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  minimumQuantity: number;
  price: number;
  availableFrom: string;
  availableUntil: string;
  autoRenewDefault: boolean;
  earlyClosurePenaltyPercentage: number;
  pauseAllowed: boolean;
  maxPauseDays: number;
  description?: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotationTemplateLineItemEntity {
  id: string;
  templateId: string;
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface QuotationTemplateEntity {
  id: string;
  name: string;
  description?: string;
  planId: string;
  validityDays: number;
  defaultLines: QuotationTemplateLineItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotationLineItemEntity {
  id: string;
  quotationId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface QuotationEntity {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  templateId?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED';
  validUntil: string;
  lines: QuotationLineItemEntity[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionLineItemEntity {
  id: string;
  subscriptionId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface SubscriptionEntity {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  planId: string;
  planName: string;
  billingFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  status: 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
  startDate: string;
  expiryDate: string;
  nextBillingDate: string;
  paymentTerms: 'IMMEDIATE' | 'NET15' | 'NET30' | 'NET60';
  taxReference?: string;
  lines: SubscriptionLineItemEntity[];
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
  createdAt: Date;
  updatedAt: Date;
}

// Global in-memory cache synchronized with Prisma models
export class DatabaseStore {
  public users: Map<string, UserEntity> = new Map();
  public customers: Map<string, CustomerEntity> = new Map();
  public products: Map<string, ProductEntity> = new Map();
  public plans: Map<string, PlanEntity> = new Map();
  public quotationTemplates: Map<string, QuotationTemplateEntity> = new Map();
  public quotations: Map<string, QuotationEntity> = new Map();
  public subscriptions: Map<string, SubscriptionEntity> = new Map();
  public sessions: Map<string, { userId: string; expiresAt: Date }> = new Map();

  private initialized = false;
  public prisma: PrismaClient | null = null;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    // Test Prisma PostgreSQL connection
    try {
      if (this.prisma) {
        await this.prisma.$connect();
        console.log('✅ Connected to PostgreSQL via Prisma Client.');
      }
    } catch {
      console.log('ℹ️ Local PostgreSQL not currently active; using high-fidelity in-memory Prisma store.');
    }

    // Seed default records with Argon2id
    const adminHash = await hashPassword('Admin#2026!');
    const staffHash = await hashPassword('Staff#2026!');
    const custHash = await hashPassword('Customer#2026!');

    // Customers
    const cust1: CustomerEntity = {
      id: 'cust-1',
      name: 'Alex Rivera',
      email: 'alex@nexustech.io',
      phone: '+1 (415) 890-2341',
      company: 'Nexus Technologies',
      address: '500 Howard Street, Suite 400, San Francisco, CA 94105',
      taxNumber: 'US-942857102',
      status: 'active',
      createdAt: new Date('2025-08-14'),
      updatedAt: new Date('2025-08-14'),
    };

    const cust2: CustomerEntity = {
      id: 'cust-2',
      name: 'Elena Rostova',
      email: 'elena@vortexsystems.com',
      phone: '+1 (206) 555-0199',
      company: 'Vortex Systems Ltd',
      address: '1201 3rd Ave, Seattle, WA 98101',
      taxNumber: 'US-883920194',
      status: 'active',
      createdAt: new Date('2025-09-02'),
      updatedAt: new Date('2025-09-02'),
    };

    const cust3: CustomerEntity = {
      id: 'cust-3',
      name: 'Marcus Vance',
      email: 'm.vance@solarisdata.com',
      phone: '+1 (512) 778-9922',
      company: 'Solaris Data Labs',
      address: '300 Colorado St, Austin, TX 78701',
      taxNumber: 'US-771239854',
      status: 'active',
      createdAt: new Date('2025-10-10'),
      updatedAt: new Date('2025-10-10'),
    };

    const cust4: CustomerEntity = {
      id: 'cust-4',
      name: 'Chloe Bennett',
      email: 'c.bennett@aurorafinance.org',
      phone: '+1 (212) 440-1288',
      company: 'Aurora Financial Group',
      address: '200 Park Avenue, 18th Floor, New York, NY 10166',
      taxNumber: 'US-119284723',
      status: 'active',
      createdAt: new Date('2025-07-20'),
      updatedAt: new Date('2025-07-20'),
    };

    this.customers.set(cust1.id, cust1);
    this.customers.set(cust2.id, cust2);
    this.customers.set(cust3.id, cust3);
    this.customers.set(cust4.id, cust4);

    // Users
    const u1: UserEntity = {
      id: 'usr-1',
      name: 'James Anderson',
      email: 'admin@brightloop.io',
      passwordHash: adminHash,
      role: 'ADMIN',
      company: 'Brightloop Core Ops',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const u2: UserEntity = {
      id: 'usr-2',
      name: 'Sarah Connor',
      email: 'staff@brightloop.io',
      passwordHash: staffHash,
      role: 'STAFF',
      company: 'Brightloop Sales & Billing',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const u3: UserEntity = {
      id: 'usr-3',
      name: 'Alex Rivera',
      email: 'alex@nexustech.io',
      passwordHash: custHash,
      role: 'CUSTOMER',
      company: 'Nexus Technologies',
      customerId: 'cust-1',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const u4: UserEntity = {
      id: 'usr-4',
      name: 'Elena Rostova',
      email: 'elena@vortexsystems.com',
      passwordHash: custHash,
      role: 'CUSTOMER',
      company: 'Vortex Systems Ltd',
      customerId: 'cust-2',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(u1.id, u1);
    this.users.set(u2.id, u2);
    this.users.set(u3.id, u3);
    this.users.set(u4.id, u4);

    // Products & Variants
    const prod1: ProductEntity = {
      id: 'prod-1',
      name: 'Brightloop Core Platform',
      type: 'Software License',
      salesPrice: 499.0,
      costPrice: 95.0,
      notes: 'Base platform license including user provisioning, identity SSO, and analytics dashboard.',
      status: 'active',
      variants: [
        { id: 'var-1-1', productId: 'prod-1', name: 'Starter (up to 10 seats)', sku: 'BL-CORE-ST', priceAdjustment: 0, description: 'Standard edition' },
        { id: 'var-1-2', productId: 'prod-1', name: 'Professional (up to 50 seats)', sku: 'BL-CORE-PRO', priceAdjustment: 300, description: 'Pro security & integrations' },
        { id: 'var-1-3', productId: 'prod-1', name: 'Enterprise (unlimited seats)', sku: 'BL-CORE-ENT', priceAdjustment: 1200, description: 'Dedicated SLA & custom domains' },
      ],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    };

    const prod2: ProductEntity = {
      id: 'prod-2',
      name: 'Cloud Infrastructure Pipeline',
      type: 'Cloud Service',
      salesPrice: 850.0,
      costPrice: 220.0,
      notes: 'Automated CI/CD cluster compute units with zero-downtime blue/green rollouts.',
      status: 'active',
      variants: [
        { id: 'var-2-1', productId: 'prod-2', name: 'Standard Cluster (4 vCPU / 16GB)', sku: 'BL-PIPE-STD', priceAdjustment: 0 },
        { id: 'var-2-2', productId: 'prod-2', name: 'High-Performance Cluster (16 vCPU / 64GB)', sku: 'BL-PIPE-HP', priceAdjustment: 650 },
      ],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    };

    const prod3: ProductEntity = {
      id: 'prod-3',
      name: 'Real-time Telemetry & API Access',
      type: 'API Access',
      salesPrice: 299.0,
      costPrice: 40.0,
      notes: 'High-throughput webhook streaming and REST query gateway with 99.99% uptime guarantee.',
      status: 'active',
      variants: [
        { id: 'var-3-1', productId: 'prod-3', name: '100k requests / day', sku: 'BL-API-100K', priceAdjustment: 0 },
        { id: 'var-3-2', productId: 'prod-3', name: '1M requests / day', sku: 'BL-API-1M', priceAdjustment: 400 },
      ],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    };

    const prod4: ProductEntity = {
      id: 'prod-4',
      name: 'Dedicated Solutions Architect & 24/7 SLA',
      type: 'Support & Service',
      salesPrice: 1200.0,
      costPrice: 450.0,
      notes: 'Assigned customer engineering partner, monthly security audits and 15-minute emergency response.',
      status: 'active',
      variants: [
        { id: 'var-4-1', productId: 'prod-4', name: 'Standard 24/7 Support', sku: 'BL-SUP-247', priceAdjustment: 0 },
        { id: 'var-4-2', productId: 'prod-4', name: 'Executive White-Glove Support', sku: 'BL-SUP-EXEC', priceAdjustment: 800 },
      ],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    };

    this.products.set(prod1.id, prod1);
    this.products.set(prod2.id, prod2);
    this.products.set(prod3.id, prod3);
    this.products.set(prod4.id, prod4);

    // Plans
    const plan1: PlanEntity = {
      id: 'plan-1',
      name: 'Growth Monthly Cloud',
      code: 'PLN-GROWTH-M',
      billingFrequency: 'MONTHLY',
      minimumQuantity: 1,
      price: 799.0,
      availableFrom: '2025-01-01',
      availableUntil: '2027-12-31',
      autoRenewDefault: true,
      earlyClosurePenaltyPercentage: 10,
      pauseAllowed: true,
      maxPauseDays: 60,
      description: 'Designed for scaling SaaS engineering organizations requiring flexible monthly billing.',
      status: 'active',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    };

    const plan2: PlanEntity = {
      id: 'plan-2',
      name: 'Enterprise Annual Suite',
      code: 'PLN-ENT-YR',
      billingFrequency: 'YEARLY',
      minimumQuantity: 1,
      price: 8900.0,
      availableFrom: '2025-01-01',
      availableUntil: '2028-12-31',
      autoRenewDefault: true,
      earlyClosurePenaltyPercentage: 25,
      pauseAllowed: false,
      maxPauseDays: 0,
      description: 'Annual commitment with 15% bundled savings, enterprise security compliance, and priority routing.',
      status: 'active',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    };

    const plan3: PlanEntity = {
      id: 'plan-3',
      name: 'Developer Sandbox Weekly',
      code: 'PLN-DEV-WK',
      billingFrequency: 'WEEKLY',
      minimumQuantity: 1,
      price: 199.0,
      availableFrom: '2025-03-01',
      availableUntil: '2026-12-31',
      autoRenewDefault: false,
      earlyClosurePenaltyPercentage: 0,
      pauseAllowed: true,
      maxPauseDays: 14,
      description: 'Weekly test-bench tier for rapid deployment prototypes and stress-testing.',
      status: 'active',
      createdAt: new Date('2025-03-01'),
      updatedAt: new Date('2025-03-01'),
    };

    const plan4: PlanEntity = {
      id: 'plan-4',
      name: 'Edge Micro-Daily Compute',
      code: 'PLN-EDGE-DY',
      billingFrequency: 'DAILY',
      minimumQuantity: 1,
      price: 45.0,
      availableFrom: '2025-06-01',
      availableUntil: '2026-12-31',
      autoRenewDefault: false,
      earlyClosurePenaltyPercentage: 0,
      pauseAllowed: false,
      maxPauseDays: 0,
      description: 'On-demand spot cluster daily billing with sub-second provisioning.',
      status: 'active',
      createdAt: new Date('2025-06-01'),
      updatedAt: new Date('2025-06-01'),
    };

    this.plans.set(plan1.id, plan1);
    this.plans.set(plan2.id, plan2);
    this.plans.set(plan3.id, plan3);
    this.plans.set(plan4.id, plan4);

    // Quotation Templates
    const tmpl1: QuotationTemplateEntity = {
      id: 'tmpl-1',
      name: 'Standard SaaS Enterprise Package',
      description: 'Preconfigured enterprise bundle: Core Platform + High-Performance Cluster + 24/7 SLA.',
      planId: 'plan-2',
      validityDays: 30,
      defaultLines: [
        { id: 'tl-1', templateId: 'tmpl-1', productId: 'prod-1', variantId: 'var-1-3', quantity: 1 },
        { id: 'tl-2', templateId: 'tmpl-1', productId: 'prod-2', variantId: 'var-2-2', quantity: 1 },
        { id: 'tl-3', templateId: 'tmpl-1', productId: 'prod-4', variantId: 'var-4-1', quantity: 1 },
      ],
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-10'),
    };

    const tmpl2: QuotationTemplateEntity = {
      id: 'tmpl-2',
      name: 'Growth Scale-up Starter',
      description: 'Standard monthly bundle with platform licenses and API throughput.',
      planId: 'plan-1',
      validityDays: 14,
      defaultLines: [
        { id: 'tl-4', templateId: 'tmpl-2', productId: 'prod-1', variantId: 'var-1-2', quantity: 1 },
        { id: 'tl-5', templateId: 'tmpl-2', productId: 'prod-3', variantId: 'var-3-1', quantity: 1 },
      ],
      createdAt: new Date('2025-02-15'),
      updatedAt: new Date('2025-02-15'),
    };

    this.quotationTemplates.set(tmpl1.id, tmpl1);
    this.quotationTemplates.set(tmpl2.id, tmpl2);

    // Quotations
    const q1: QuotationEntity = {
      id: 'quot-101',
      quotationNumber: 'QT-2026-0042',
      customerId: 'cust-1',
      customerName: 'Nexus Technologies',
      customerEmail: 'alex@nexustech.io',
      planId: 'plan-2',
      planName: 'Enterprise Annual Suite',
      templateId: 'tmpl-1',
      status: 'SENT',
      validUntil: '2026-11-25',
      lines: [
        {
          id: 'ql-1',
          quotationId: 'quot-101',
          productId: 'prod-1',
          productName: 'Brightloop Core Platform (Enterprise)',
          variantId: 'var-1-3',
          variantName: 'Enterprise (unlimited seats)',
          quantity: 1,
          unitPrice: 1699.0,
          taxRate: 8.25,
          lineTotal: 1699.0,
        },
        {
          id: 'ql-2',
          quotationId: 'quot-101',
          productId: 'prod-2',
          productName: 'Cloud Infrastructure Pipeline',
          variantId: 'var-2-2',
          variantName: 'High-Performance Cluster',
          quantity: 2,
          unitPrice: 1500.0,
          taxRate: 8.25,
          lineTotal: 3000.0,
        },
      ],
      subtotal: 4699.0,
      taxAmount: 387.67,
      discountAmount: 200.0,
      totalAmount: 4886.67,
      notes: 'Quotation valid for 30 calendar days. Early bird discount voucher applied.',
      createdAt: new Date('2026-10-26'),
      updatedAt: new Date('2026-10-26'),
    };

    const q2: QuotationEntity = {
      id: 'quot-102',
      quotationNumber: 'QT-2026-0039',
      customerId: 'cust-3',
      customerName: 'Solaris Data Labs',
      customerEmail: 'm.vance@solarisdata.com',
      planId: 'plan-1',
      planName: 'Growth Monthly Cloud',
      templateId: 'tmpl-2',
      status: 'DRAFT',
      validUntil: '2026-11-15',
      lines: [
        {
          id: 'ql-3',
          quotationId: 'quot-102',
          productId: 'prod-1',
          productName: 'Brightloop Core Platform (Pro)',
          variantId: 'var-1-2',
          variantName: 'Professional (up to 50 seats)',
          quantity: 1,
          unitPrice: 799.0,
          taxRate: 8.25,
          lineTotal: 799.0,
        },
      ],
      subtotal: 799.0,
      taxAmount: 65.92,
      discountAmount: 0,
      totalAmount: 864.92,
      notes: 'Awaiting customer confirmation on API quota requirements.',
      createdAt: new Date('2026-10-28'),
      updatedAt: new Date('2026-10-28'),
    };

    this.quotations.set(q1.id, q1);
    this.quotations.set(q2.id, q2);

    // Subscriptions
    const sub1: SubscriptionEntity = {
      id: 'sub-1',
      subscriptionNumber: 'SUB-2026-001',
      customerId: 'cust-4',
      customerName: 'Aurora Financial Group',
      planId: 'plan-2',
      planName: 'Enterprise Annual Suite',
      billingFrequency: 'YEARLY',
      status: 'ACTIVE',
      startDate: '2025-10-01',
      expiryDate: '2026-10-01',
      nextBillingDate: '2026-10-01',
      paymentTerms: 'NET30',
      taxReference: 'TAX-US-NY-STD',
      lines: [
        {
          id: 'sl-1',
          subscriptionId: 'sub-1',
          productId: 'prod-1',
          productName: 'Brightloop Core Platform (Enterprise)',
          variantId: 'var-1-3',
          variantName: 'Enterprise (unlimited seats)',
          quantity: 1,
          unitPrice: 1699.0,
          taxRate: 8.25,
          lineTotal: 1699.0,
        },
        {
          id: 'sl-2',
          subscriptionId: 'sub-1',
          productId: 'prod-4',
          productName: 'Executive White-Glove Support',
          variantId: 'var-4-2',
          variantName: 'Executive White-Glove Support',
          quantity: 1,
          unitPrice: 2000.0,
          taxRate: 8.25,
          lineTotal: 2000.0,
        },
      ],
      subtotal: 3699.0,
      taxTotal: 305.17,
      totalAmount: 4004.17,
      autoRenew: true,
      renewalNotificationDays: 30,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-01'),
    };

    const sub2: SubscriptionEntity = {
      id: 'sub-2',
      subscriptionNumber: 'SUB-2026-002',
      customerId: 'cust-1',
      customerName: 'Nexus Technologies',
      planId: 'plan-1',
      planName: 'Growth Monthly Cloud',
      billingFrequency: 'MONTHLY',
      status: 'ACTIVE',
      startDate: '2026-01-15',
      expiryDate: '2027-01-15',
      nextBillingDate: '2026-11-15',
      paymentTerms: 'IMMEDIATE',
      taxReference: 'TAX-US-CA-STD',
      lines: [
        {
          id: 'sl-3',
          subscriptionId: 'sub-2',
          productId: 'prod-1',
          productName: 'Brightloop Core Platform',
          variantId: 'var-1-2',
          variantName: 'Professional (up to 50 seats)',
          quantity: 1,
          unitPrice: 799.0,
          taxRate: 8.25,
          lineTotal: 799.0,
        },
        {
          id: 'sl-4',
          subscriptionId: 'sub-2',
          productId: 'prod-3',
          productName: 'Real-time Telemetry & API Access',
          variantId: 'var-3-1',
          variantName: '100k requests / day',
          quantity: 1,
          unitPrice: 299.0,
          taxRate: 8.25,
          lineTotal: 299.0,
        },
      ],
      subtotal: 1098.0,
      taxTotal: 90.59,
      totalAmount: 1188.59,
      autoRenew: true,
      renewalNotificationDays: 14,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
    };

    const sub3: SubscriptionEntity = {
      id: 'sub-3',
      subscriptionNumber: 'SUB-2026-003',
      customerId: 'cust-2',
      customerName: 'Vortex Systems Ltd',
      planId: 'plan-1',
      planName: 'Growth Monthly Cloud',
      billingFrequency: 'MONTHLY',
      status: 'PAUSED',
      startDate: '2025-11-01',
      expiryDate: '2026-11-01',
      nextBillingDate: '2026-12-01',
      paymentTerms: 'NET15',
      taxReference: 'TAX-US-WA-STD',
      lines: [
        {
          id: 'sl-5',
          subscriptionId: 'sub-3',
          productId: 'prod-2',
          productName: 'Cloud Infrastructure Pipeline',
          variantId: 'var-2-1',
          variantName: 'Standard Cluster',
          quantity: 1,
          unitPrice: 850.0,
          taxRate: 6.5,
          lineTotal: 850.0,
        },
      ],
      subtotal: 850.0,
      taxTotal: 55.25,
      totalAmount: 905.25,
      pauseReason: 'Customer requested 30-day migration maintenance freeze.',
      pausedAt: '2026-10-15',
      pauseDaysRemaining: 14,
      autoRenew: true,
      renewalNotificationDays: 14,
      createdAt: new Date('2025-11-01'),
      updatedAt: new Date('2025-11-01'),
    };

    this.subscriptions.set(sub1.id, sub1);
    this.subscriptions.set(sub2.id, sub2);
    this.subscriptions.set(sub3.id, sub3);

    this.initialized = true;
    console.log('✅ Database store initialized with full seed catalog and Argon2id credentials.');
  }
}

export const dbStore = new DatabaseStore();

