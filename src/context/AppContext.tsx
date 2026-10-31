import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Customer,
  Product,
  Plan,
  QuotationTemplate,
  Quotation,
  Subscription,
  TaxRule,
  DiscountRule,
  Invoice,
  Payment,
  SubscriptionStatus,
} from '../types';
import {
  initialCustomers,
  initialProducts,
  initialPlans,
  initialQuotationTemplates,
  initialQuotations,
  initialSubscriptions,
  initialTaxRules,
  initialDiscountRules,
  initialInvoices,
  initialPayments,
} from '../data/mockData';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalSpent' | 'activeSubscriptionsCount'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  archiveProduct: (id: string) => void;

  plans: Plan[];
  addPlan: (plan: Omit<Plan, 'id'>) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;

  quotationTemplates: QuotationTemplate[];
  addQuotationTemplate: (template: Omit<QuotationTemplate, 'id'>) => void;

  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>) => string;
  updateQuotationStatus: (id: string, status: Quotation['status']) => void;
  convertQuotationToSubscription: (quotationId: string) => string | null;

  subscriptions: Subscription[];
  addSubscription: (subscription: Omit<Subscription, 'id' | 'subscriptionNumber' | 'createdAt'>) => string;
  updateSubscriptionStatus: (id: string, status: SubscriptionStatus, reason?: string) => void;
  pauseSubscription: (id: string, reason: string) => { success: boolean; message: string };
  resumeSubscription: (id: string) => { success: boolean; message: string };
  closeSubscription: (id: string, reason: string) => { success: boolean; message: string; penalty?: number };
  updateSubscriptionRenewal: (id: string, autoRenew: boolean, notificationDays: number) => void;

  taxRules: TaxRule[];
  addTaxRule: (tax: Omit<TaxRule, 'id'>) => void;
  updateTaxRule: (id: string, updates: Partial<TaxRule>) => void;

  discountRules: DiscountRule[];
  addDiscountRule: (rule: Omit<DiscountRule, 'id' | 'usedCount'>) => void;
  updateDiscountRule: (id: string, updates: Partial<DiscountRule>) => void;

  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => string;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;

  payments: Payment[];
  recordPayment: (payment: Omit<Payment, 'id' | 'paymentNumber'>) => void;

  toasts: ToastNotification[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or defaults
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('bl_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('bl_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem('bl_plans');
    return saved ? JSON.parse(saved) : initialPlans;
  });

  const [quotationTemplates, setQuotationTemplates] = useState<QuotationTemplate[]>(() => {
    const saved = localStorage.getItem('bl_templates');
    return saved ? JSON.parse(saved) : initialQuotationTemplates;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('bl_quotations');
    return saved ? JSON.parse(saved) : initialQuotations;
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('bl_subscriptions');
    return saved ? JSON.parse(saved) : initialSubscriptions;
  });

  const [taxRules, setTaxRules] = useState<TaxRule[]>(() => {
    const saved = localStorage.getItem('bl_taxes');
    return saved ? JSON.parse(saved) : initialTaxRules;
  });

  const [discountRules, setDiscountRules] = useState<DiscountRule[]>(() => {
    const saved = localStorage.getItem('bl_discounts');
    return saved ? JSON.parse(saved) : initialDiscountRules;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('bl_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('bl_payments');
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Sync to local storage
  useEffect(() => localStorage.setItem('bl_customers', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('bl_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('bl_plans', JSON.stringify(plans)), [plans]);
  useEffect(() => localStorage.setItem('bl_templates', JSON.stringify(quotationTemplates)), [quotationTemplates]);
  useEffect(() => localStorage.setItem('bl_quotations', JSON.stringify(quotations)), [quotations]);
  useEffect(() => localStorage.setItem('bl_subscriptions', JSON.stringify(subscriptions)), [subscriptions]);
  useEffect(() => localStorage.setItem('bl_taxes', JSON.stringify(taxRules)), [taxRules]);
  useEffect(() => localStorage.setItem('bl_discounts', JSON.stringify(discountRules)), [discountRules]);
  useEffect(() => localStorage.setItem('bl_invoices', JSON.stringify(invoices)), [invoices]);
  useEffect(() => localStorage.setItem('bl_payments', JSON.stringify(payments)), [payments]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Customer actions
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'totalSpent' | 'activeSubscriptionsCount'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      totalSpent: 0,
      activeSubscriptionsCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    showToast(`Customer ${newCustomer.name} created successfully.`);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Customer information updated.');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast('Customer record removed.', 'info');
  };

  // Product actions
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Product ${newProduct.name} saved.`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Product details updated.');
  };

  const archiveProduct = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'archived' } : p)));
    showToast('Product archived.', 'info');
  };

  // Plan actions
  const addPlan = (planData: Omit<Plan, 'id'>) => {
    const newPlan: Plan = {
      ...planData,
      id: `plan-${Date.now()}`,
    };
    setPlans((prev) => [newPlan, ...prev]);
    showToast(`Plan ${newPlan.name} created.`);
  };

  const updatePlan = (id: string, updates: Partial<Plan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Subscription plan updated.');
  };

  // Quotation Templates
  const addQuotationTemplate = (tmplData: Omit<QuotationTemplate, 'id'>) => {
    const newTmpl: QuotationTemplate = {
      ...tmplData,
      id: `tmpl-${Date.now()}`,
    };
    setQuotationTemplates((prev) => [...prev, newTmpl]);
    showToast(`Quotation template ${newTmpl.name} saved.`);
  };

  // Quotations
  const addQuotation = (qData: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>) => {
    const qNum = `QT-2026-0${100 + quotations.length + 1}`;
    const newQuotation: Quotation = {
      ...qData,
      id: `quot-${Date.now()}`,
      quotationNumber: qNum,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setQuotations((prev) => [newQuotation, ...prev]);
    showToast(`Quotation ${qNum} prepared.`);
    return newQuotation.id;
  };

  const updateQuotationStatus = (id: string, status: Quotation['status']) => {
    setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    showToast(`Quotation marked as ${status}.`);
  };

  const convertQuotationToSubscription = (quotationId: string) => {
    const quot = quotations.find((q) => q.id === quotationId);
    if (!quot) return null;

    const plan = plans.find((p) => p.id === quot.planId) || plans[0];
    const subNum = `SUB-2026-00${subscriptions.length + 1}`;

    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      subscriptionNumber: subNum,
      customerId: quot.customerId,
      customerName: quot.customerName,
      planId: quot.planId,
      planName: quot.planName,
      billingFrequency: plan.billingFrequency,
      status: 'CONFIRMED',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextBillingDate: new Date().toISOString().split('T')[0],
      paymentTerms: 'NET30',
      lines: quot.lines,
      taxReference: 'TAX-US-CA-STD',
      subtotal: quot.subtotal,
      taxTotal: quot.taxAmount,
      totalAmount: quot.totalAmount,
      autoRenew: plan.autoRenewDefault,
      renewalNotificationDays: 14,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setSubscriptions((prev) => [newSub, ...prev]);
    setQuotations((prev) => prev.map((q) => (q.id === quotationId ? { ...q, status: 'accepted' } : q)));

    // Automatically generate first Invoice for confirmed subscription
    const invNum = `INV-2026-09${50 + invoices.length + 1}`;
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNum,
      subscriptionId: newSub.id,
      subscriptionNumber: newSub.subscriptionNumber,
      customerId: newSub.customerId,
      customerName: newSub.customerName,
      customerEmail: quot.customerEmail,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'issued',
      lines: newSub.lines,
      subtotal: newSub.subtotal,
      taxAmount: newSub.taxTotal,
      discountAmount: quot.discountAmount,
      totalAmount: newSub.totalAmount,
      amountPaid: 0,
      amountDue: newSub.totalAmount,
      paymentTerms: 'NET30',
      notes: `Invoice generated from quotation ${quot.quotationNumber}.`,
    };
    setInvoices((prev) => [newInv, ...prev]);

    showToast(`Quotation accepted & subscription ${subNum} generated! Initial invoice ${invNum} created.`);
    return newSub.id;
  };

  // Subscriptions & Lifecycle
  const addSubscription = (subData: Omit<Subscription, 'id' | 'subscriptionNumber' | 'createdAt'>) => {
    const subNum = `SUB-2026-00${subscriptions.length + 1}`;
    const newSub: Subscription = {
      ...subData,
      id: `sub-${Date.now()}`,
      subscriptionNumber: subNum,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSubscriptions((prev) => [newSub, ...prev]);
    showToast(`Subscription ${subNum} registered.`);
    return newSub.id;
  };

  const updateSubscriptionStatus = (id: string, status: SubscriptionStatus, reason?: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          status,
          ...(status === 'CLOSED' ? { closedAt: new Date().toISOString().split('T')[0], closureReason: reason } : {}),
        };
      })
    );
    showToast(`Subscription status updated to ${status}.`);
  };

  const pauseSubscription = (id: string, reason: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return { success: false, message: 'Subscription not found.' };

    const plan = plans.find((p) => p.id === sub.planId);
    if (plan && !plan.pauseAllowed) {
      showToast(`Plan "${plan.name}" does not allow pausing.`, 'error');
      return { success: false, message: `Plan "${plan.name}" does not permit pausing.` };
    }

    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          status: 'PAUSED',
          pauseReason: reason,
          pausedAt: new Date().toISOString().split('T')[0],
          pauseDaysRemaining: plan?.maxPauseDays || 30,
        };
      })
    );
    showToast(`Subscription ${sub.subscriptionNumber} paused successfully.`);
    return { success: true, message: `Subscription paused.` };
  };

  const resumeSubscription = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return { success: false, message: 'Subscription not found.' };

    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          status: 'ACTIVE',
          pauseReason: undefined,
          pausedAt: undefined,
          pauseDaysRemaining: undefined,
        };
      })
    );
    showToast(`Subscription ${sub.subscriptionNumber} resumed to ACTIVE status.`);
    return { success: true, message: `Subscription resumed.` };
  };

  const closeSubscription = (id: string, reason: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return { success: false, message: 'Subscription not found.' };

    const plan = plans.find((p) => p.id === sub.planId);
    const penaltyPct = plan?.earlyClosurePenaltyPercentage || 0;
    const penalty = penaltyPct > 0 ? (sub.totalAmount * penaltyPct) / 100 : 0;

    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          status: 'CLOSED',
          closedAt: new Date().toISOString().split('T')[0],
          closureReason: reason,
        };
      })
    );

    const penaltyMsg = penalty > 0 ? ` Early closure fee of $${penalty.toFixed(2)} (${penaltyPct}%) calculated.` : '';
    showToast(`Subscription ${sub.subscriptionNumber} closed.${penaltyMsg}`);
    return { success: true, message: `Subscription closed.`, penalty };
  };

  const updateSubscriptionRenewal = (id: string, autoRenew: boolean, notificationDays: number) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, autoRenew, renewalNotificationDays: notificationDays } : s))
    );
    showToast('Renewal settings updated.');
  };

  // Tax Rules
  const addTaxRule = (taxData: Omit<TaxRule, 'id'>) => {
    const newTax: TaxRule = {
      ...taxData,
      id: `tax-${Date.now()}`,
    };
    setTaxRules((prev) => [...prev, newTax]);
    showToast(`Tax rule ${newTax.name} added.`);
  };

  const updateTaxRule = (id: string, updates: Partial<TaxRule>) => {
    setTaxRules((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    showToast('Tax rule updated.');
  };

  // Discount Rules
  const addDiscountRule = (ruleData: Omit<DiscountRule, 'id' | 'usedCount'>) => {
    const newRule: DiscountRule = {
      ...ruleData,
      id: `disc-${Date.now()}`,
      usedCount: 0,
    };
    setDiscountRules((prev) => [...prev, newRule]);
    showToast(`Discount rule ${newRule.code} created.`);
  };

  const updateDiscountRule = (id: string, updates: Partial<DiscountRule>) => {
    setDiscountRules((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    showToast('Discount rule updated.');
  };

  // Invoices
  const addInvoice = (invData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const invNum = `INV-2026-09${50 + invoices.length + 1}`;
    const newInv: Invoice = {
      ...invData,
      id: `inv-${Date.now()}`,
      invoiceNumber: invNum,
    };
    setInvoices((prev) => [newInv, ...prev]);
    showToast(`Invoice ${invNum} drafted.`);
    return newInv.id;
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    showToast(`Invoice status updated to ${status}.`);
  };

  // Payments
  const recordPayment = (payData: Omit<Payment, 'id' | 'paymentNumber'>) => {
    const payNum = `PAY-2026-0${500 + payments.length + 1}`;
    const newPayment: Payment = {
      ...payData,
      id: `pay-${Date.now()}`,
      paymentNumber: payNum,
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Update invoice status & amount paid
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === payData.invoiceId || inv.invoiceNumber === payData.invoiceNumber) {
          const newAmountPaid = inv.amountPaid + payData.amount;
          const newAmountDue = Math.max(0, inv.totalAmount - newAmountPaid);
          const newStatus = newAmountDue <= 0 ? 'paid' : inv.status;
          return {
            ...inv,
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            status: newStatus,
          };
        }
        return inv;
      })
    );

    showToast(`Payment ${payNum} of $${payData.amount.toFixed(2)} recorded successfully.`);
  };

  return (
    <AppContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        products,
        addProduct,
        updateProduct,
        archiveProduct,
        plans,
        addPlan,
        updatePlan,
        quotationTemplates,
        addQuotationTemplate,
        quotations,
        addQuotation,
        updateQuotationStatus,
        convertQuotationToSubscription,
        subscriptions,
        addSubscription,
        updateSubscriptionStatus,
        pauseSubscription,
        resumeSubscription,
        closeSubscription,
        updateSubscriptionRenewal,
        taxRules,
        addTaxRule,
        updateTaxRule,
        discountRules,
        addDiscountRule,
        updateDiscountRule,
        invoices,
        addInvoice,
        updateInvoiceStatus,
        payments,
        recordPayment,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

