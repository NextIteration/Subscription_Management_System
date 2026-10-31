
# PRD — Member 1: Products, Plans, Quotations & Subscriptions

**Project:** Brightloop Software Subscription Management System
**Owner:** Member 1

## 1. Project Overview

Build the product and subscription management part of the Brightloop Software Subscription Management System.

Member 1 is responsible for authentication, customer management, products, plans, quotations, subscriptions and the customer-facing My Subscriptions portal.

## 2. What Member 1 Must Build

### 2.1 Authentication and Roles

- Registration and login using a unique email address.
- Password must be longer than 8 characters and contain uppercase, lowercase and a special character.
- Password reset through an email link.
- Three roles: Admin, Internal Staff and Customer.
- Only Admin can create staff accounts.
- Implement role-based access and permissions.
- Customers must only access their own records.

### 2.2 Customer Management

- Authorized staff can create, view and manage customer records.
- Maintain the customer information required for quotations, subscriptions and invoices.
- Link each customer to their subscriptions and other related records.
- Customers must be able to access only their own information.

### 2.3 Product Management

- Admin can create, view, edit and manage products.
- Product fields:
  - Name
  - Type
  - Sales price
  - Cost price
  - Notes
- Support product variants and variant price adjustments.

### 2.4 Subscription Plans

- Admin can create and manage subscription plans.
- Support billing frequencies:
  - Daily
  - Weekly
  - Monthly
  - Yearly
- Store minimum quantity and plan availability dates.
- Support plan end, early closure, pause and renewal settings.
- Apply the selected plan's rules to its subscriptions.
- Do not renew every subscription automatically without considering the configured renewal rules and customer decision.

### 2.5 Quotations

- Allow authorized staff to create and manage quotation templates.
- Templates must contain predefined plans and product lines.
- Each template must have a validity period.
- Allow staff to prepare quotations for customers using these templates.
- Expired quotations must not be treated as valid.

### 2.6 Subscription Management

- Create and manage subscriptions linked to customers and plans.
- Each subscription must contain:
  - Unique subscription number
  - Customer
  - Plan
  - Start date
  - Expiry date
  - Payment terms
  - Product lines
  - Quantity
  - Unit price
  - Tax reference
  - Line amount
  - Current status
- Implement the required lifecycle:

  `DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED`

- Enforce valid status transitions.
- Apply the selected plan's closure, pause, early-closure and renewal rules.
- Maintain the billing dates and subscription information required by Member 2.

### 2.7 Customer Portal — My Subscriptions

- Customers can log in and view their own subscriptions.
- Display subscription number, plan, dates and status.
- Allow only subscription actions supported by the plan and business rules.
- Never expose another customer's subscriptions.

## 3. Member 2's Responsibilities — Context Only

Member 2 is responsible for:

- Tax-rule configuration and tax calculation.
- Discount-rule configuration and eligibility.
- Automatic invoice generation.
- Invoice management and invoice PDFs.
- Payment recording.
- Paid, outstanding and overdue tracking.
- Financial dashboard and reports.
- Customer portal — My Invoices.

Do not build these billing and finance modules as part of Member 1's work.

## 4. Integration with Member 2

- Member 1 owns the subscription and subscription-line data.
- Member 2 must use Member 1's subscription data to generate invoices.
- Do not create a separate subscription model for billing.
- Provide the customer, product, quantity, price, tax reference, billing frequency, subscription status and relevant billing dates required by Member 2.
- Make the next billing date or its agreed equivalent available.
- Only eligible and due subscriptions should be billed.
- When subscription information affecting future billing changes, Member 2 must receive or access the updated information.
- Both members must use the same authentication system, backend and database.
- Member 1 builds the shared authentication foundation. Member 2 uses it.
- Coordinate shared database changes and avoid duplicate models or conflicting migrations.

## 5. Technology Stack

Use the following stack for the project:

- Frontend: React, Vite and TypeScript.
- Styling: Tailwind CSS.
- UI components: shadcn/ui.
- Routing: React Router.
- API data handling: TanStack Query.
- Backend: Node.js, Express and TypeScript.
- Database: PostgreSQL.
- ORM: Prisma.
- Authentication: Secure sessions using HttpOnly cookies.
- Password hashing: Argon2id.
- Email: Nodemailer with SMTP.

Both members must use the same project stack. Do not introduce a separate frontend, backend or database for this module.

## 6. Performance Requirement

- Pages and APIs should meet the PS performance target of under 2 seconds, including when handling thousands of subscriptions.

## 7. Completion Checklist

- [ ] Registration, login and password reset work.
- [ ] Role-based permissions work.
- [ ] Admin can create staff accounts.
- [ ] Staff can manage customer records.
- [ ] Admin can manage products and variants.
- [ ] Admin can manage subscription plans and their rules.
- [ ] Staff can create quotation templates and quotations.
- [ ] Subscription creation and lifecycle management work.
- [ ] Customers can view only their own subscriptions.
- [ ] Member 2 can access the agreed subscription data for billing.
- [ ] Performance requirement is addressed.
