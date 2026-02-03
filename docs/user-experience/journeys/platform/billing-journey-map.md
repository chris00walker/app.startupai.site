---
purpose: "Complete billing journey map for payment lifecycle and compliance"
status: "active"
last_reviewed: "2026-01-22"
---

# Complete Billing Journey Map

**End-to-End User Experience Specification**

**Status:** Active
**Last Updated:** 2026-01-22
**Persona Reference:** Founder, Consultant (paid users and trial upgraders)

---

## Document Purpose

This document maps the complete billing journey including payment management, invoicing, dunning, refunds, and tax compliance. This is a **critical compliance journey** with legal and financial implications.

**Billing Promise:** "Transparent pricing, easy management, no surprises"
**Compliance Requirements:** PCI DSS, GDPR, Tax (VAT/GST)

---

## Journey Overview

The Billing journey consists of 6 phases covering the complete payment lifecycle:

| Phase | Focus | Key Workflows | Stories |
|-------|-------|---------------|---------|
| Phase 1 | Billing Management | View history, download invoices | US-B01, US-B02 |
| Phase 2 | Payment Methods | Update cards, manage methods | US-B03 |
| Phase 3 | Payment Failure | Dunning flow, recovery | US-B04, US-B10 |
| Phase 4 | Plan Changes | Upgrade, downgrade, cycle change | US-B06, US-B09 |
| Phase 5 | Tax Compliance | VAT/GST invoices | US-B07 |
| Phase 6 | Refunds & Promos | Refund requests, promo codes | US-B05, US-B08 |

---

## Billing States

```
┌─────────────────────────────────────────────────────────────────┐
│                        BILLING STATES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│  │  Trial  │───>│  Active │───>│Past Due │───>│Suspended│     │
│  │         │    │         │    │         │    │         │     │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘     │
│       │              │              │              │           │
│       │              │              │              │           │
│       ▼              ▼              ▼              ▼           │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│  │Expired  │    │Cancelled│    │Recovered│    │Churned  │     │
│  │(No Pay) │    │(by user)│    │(Payment)│    │(No Pay) │     │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| State | Description | User Access | Actions Available |
|-------|-------------|-------------|-------------------|
| `trial` | 30-day evaluation | Limited features | Upgrade |
| `active` | Paid, current | Full features | All billing actions |
| `past_due` | Payment failed | Full (grace period) | Update payment |
| `suspended` | Multiple failures | Read-only | Update payment, cancel |
| `cancelled` | User cancelled | Degrades over time | Reactivate |
| `churned` | Failed recovery | None | New subscription |

---

## Phase 1: Billing Management

### Step 1: View Billing Dashboard (US-B01)

```yaml
touchpoint: /settings/billing
user_state: reviewing_billing
user_goal: understand_billing_status
user_actions:
  - navigates to Settings → Billing
  - views current plan and status
  - sees upcoming invoice
  - reviews payment method on file
user_emotions: administrative, cost_conscious
pain_points:
  - unclear what's being charged
  - can't find invoice history
success_metrics:
  - billing_page_load_time: <2 seconds
  - information_findability: >90%

billing_dashboard_ui:
  layout: "two-column: overview + details"

  subscription_card:
    current_plan:
      name: "Founder" or "Consultant"
      price: "$49/mo" or "$149/mo"
      status_badge: "Active" (green) | "Past Due" (amber) | "Cancelled" (red)

    billing_cycle:
      current_period: "Jan 1 - Jan 31, 2026"
      next_payment: "Feb 1, 2026"
      amount_due: "$49.00"

    quick_actions:
      - "Change Plan"
      - "Cancel Subscription"
      - "Switch to Annual (Save 20%)"

  payment_method_card:
    card_info:
      brand: "Visa"
      last4: "4242"
      expiry: "12/2027"
    actions:
      - "Update Payment Method"
      - "Add Backup Card"

  billing_history_section:
    title: "Billing History"
    table:
      columns: ["Date", "Description", "Amount", "Status", "Invoice"]
      sorting: "Most recent first"
      pagination: "10 per page"
```

### Step 2: View Billing History (US-B01)

```yaml
touchpoint: /settings/billing/history
user_state: reviewing_past_payments
user_goal: see_all_past_charges
user_actions:
  - scrolls through billing history
  - filters by date range
  - sees payment status for each
user_emotions: analytical, verification
pain_points:
  - missing invoices
  - unclear charge descriptions
success_metrics:
  - complete_history_displayed: 100%
  - invoice_availability: 100%

billing_history_ui:
  filters:
    date_range: "Last 3 months | 6 months | 12 months | All"
    status: "All | Paid | Refunded | Failed"

  table:
    date: "Invoice date"
    description: "Founder Plan - Monthly" or "Consultant Plan - Annual"
    amount: "$49.00"
    status:
      paid: "Paid (green checkmark)"
      refunded: "Refunded (blue)"
      failed: "Failed (red)"
    actions:
      download: "Download PDF"
      view: "View Details"

  empty_state:
    message: "No billing history yet"
    trial_users: "You're on a free trial. No charges yet."
```

### Step 3: Download Invoice (US-B02)

```yaml
touchpoint: /settings/billing/history → Download
user_state: needs_documentation
user_goal: get_invoice_for_records
user_actions:
  - finds invoice in history
  - clicks "Download PDF"
  - saves invoice file
user_emotions: administrative, compliant
pain_points:
  - slow download
  - missing tax info
success_metrics:
  - download_success_rate: >99%
  - invoice_completeness: 100% (legal requirements)

invoice_content:
  header:
    company_name: "StartupAI, Inc."
    company_address: "[Legal address]"
    tax_id: "EIN: XX-XXXXXXX"
    logo: "StartupAI logo"

  invoice_details:
    invoice_number: "INV-2026-001234"
    invoice_date: "January 1, 2026"
    due_date: "January 1, 2026"
    status: "Paid"

  customer_details:
    name: "{user name}"
    email: "{user email}"
    address: "{billing address if provided}"
    tax_id: "{customer VAT/GST if provided}"

  line_items:
    columns: ["Description", "Quantity", "Unit Price", "Amount"]
    example:
      - description: "Founder Plan - Monthly Subscription"
        quantity: "1"
        unit_price: "$49.00"
        amount: "$49.00"

  totals:
    subtotal: "$49.00"
    tax: "$0.00" (or calculated VAT/GST)
    total: "$49.00"
    payment_method: "Visa ending in 4242"
    payment_date: "January 1, 2026"

  footer:
    thank_you: "Thank you for your business"
    support_email: "billing@startupai.site"
    terms: "Payment terms: Due upon receipt"
```

---

## Phase 2: Payment Methods

### Step 4: Update Payment Method (US-B03)

```yaml
touchpoint: /settings/billing/payment-method
user_state: updating_payment
user_goal: change_card_on_file
user_actions:
  - clicks "Update Payment Method"
  - enters new card details
  - confirms update
  - sees confirmation
user_emotions: administrative, cautious
pain_points:
  - card entry friction
  - validation errors
success_metrics:
  - update_success_rate: >95%
  - time_to_update: <2 minutes

payment_method_ui:
  current_method:
    display: "Visa ending in 4242, expires 12/2027"
    status: "Primary payment method"

  update_form:
    stripe_elements: true  # PCI compliant
    fields:
      card_number: "Stripe CardElement"
      name_on_card: "Text input"
      billing_address:
        line1: "Street address"
        city: "City"
        state: "State/Province"
        postal_code: "ZIP/Postal code"
        country: "Country dropdown"

    save_button:
      text: "Update Payment Method"
      loading: "Updating..."

  confirmation:
    success:
      message: "Payment method updated successfully"
      detail: "Your new card ending in {last4} is now your primary payment method"
    failure:
      message: "Unable to update payment method"
      detail: "{Stripe error message}"
      retry: "Try Again"

security_notes:
  pci_compliance: "Card details never touch our servers"
  tokenization: "Stripe handles all card data"
  encryption: "All data transmitted over HTTPS"
```

### Step 5: Add Backup Payment Method (US-B03)

```yaml
touchpoint: /settings/billing/payment-method/add
user_state: adding_backup
user_goal: ensure_payment_continuity
user_actions:
  - clicks "Add Backup Card"
  - enters card details
  - confirms addition
  - sees both cards listed
user_emotions: proactive, cautious
pain_points:
  - unclear which card is primary
  - confusion about when backup is used
success_metrics:
  - backup_card_adoption: >10%
  - reduced_payment_failures: 15%

backup_method_ui:
  explanation:
    header: "Why add a backup card?"
    reasons:
      - "Automatic fallback if primary card fails"
      - "No interruption to your service"
      - "Easy to switch between cards"

  card_list:
    primary:
      badge: "Primary"
      actions: ["Set as Backup", "Remove"]
    backup:
      badge: "Backup"
      actions: ["Set as Primary", "Remove"]

  add_form:
    same_as_update: true
    label: "Add as backup payment method"
```

---

## Phase 3: Payment Failure (Dunning)

### Step 6: Handle Payment Failure (US-B04)

```yaml
touchpoint: dashboard banner + email + /settings/billing
user_state: payment_failed
user_goal: resolve_payment_issue
user_actions:
  - receives failure notification
  - sees banner on dashboard
  - clicks to update payment
  - resolves issue
user_emotions: worried, urgent
pain_points:
  - unclear why payment failed
  - fear of losing access
success_metrics:
  - recovery_rate_day_3: >40%
  - recovery_rate_day_7: >60%
  - recovery_rate_day_14: >75%

dunning_sequence:
  day_0:
    trigger: "First payment failure"
    automatic_retry: "Immediate retry"
    user_notification:
      email: "Payment failed - Action required"
      dashboard_banner: "red - Payment failed"
    access: "Full access maintained"

  day_1:
    automatic_retry: "Second retry"
    user_notification:
      email: "Reminder: Update your payment method"
    access: "Full access maintained"

  day_3:
    automatic_retry: "Third retry"
    user_notification:
      email: "Urgent: Your subscription is at risk"
      dashboard_banner: "red - Update payment to avoid interruption"
    access: "Full access maintained"

  day_7:
    automatic_retry: "Final retry"
    user_notification:
      email: "Final warning: Service suspension in 7 days"
      in_app_modal: "Payment overdue modal"
    access: "Full access maintained"

  day_14:
    action: "Suspend account"
    user_notification:
      email: "Your account has been suspended"
      dashboard: "Suspended state - Update payment to restore"
    access: "Read-only"

  day_30:
    action: "Cancel subscription"
    user_notification:
      email: "Your subscription has been cancelled"
    access: "No access"
    data_retention: "90 days per retention policy"

failure_notification_ui:
  dashboard_banner:
    style: "red background, dismissable: false"
    message: "Payment failed on {date}. Update your payment method to continue service."
    cta: "Update Payment Method"

  email_content:
    subject: "Action required: Payment for StartupAI failed"
    body:
      - "Your payment of $X failed on {date}"
      - "Reason: {decline_reason}"
      - "To avoid service interruption, please update your payment method"
    cta_button: "Update Payment Method"
    deadline: "Update by {day_14} to maintain access"
```

### Step 7: Resume After Payment Recovery (US-B10)

```yaml
touchpoint: /settings/billing (after successful payment)
user_state: recovered
user_goal: confirm_access_restored
user_actions:
  - updates payment method
  - payment succeeds
  - sees confirmation
  - access restored
user_emotions: relieved, grateful
pain_points:
  - unclear if access restored
  - worried about data loss
success_metrics:
  - recovery_confirmation_time: <30 seconds
  - full_access_restoration: 100%

recovery_flow:
  immediate_actions:
    - "Process outstanding payment"
    - "Restore full access"
    - "Remove suspension banner"
    - "Send confirmation email"

  confirmation_ui:
    success_message:
      title: "Payment successful!"
      body: "Your account is now current. Full access has been restored."
      detail: "Amount charged: $X to card ending in {last4}"

    receipt:
      display: "View receipt"
      download: "Download PDF"

  confirmation_email:
    subject: "Welcome back - Your payment was successful"
    content:
      - "Your payment of $X was processed successfully"
      - "Your account is now current"
      - "Full access has been restored"
      - "Next billing date: {next_date}"
```

---

## Phase 4: Plan Changes

### Step 8: Change Plan (US-B06)

```yaml
touchpoint: /settings/billing/change-plan
user_state: considering_plan_change
user_goal: upgrade_or_downgrade_plan
user_actions:
  - clicks "Change Plan"
  - reviews plan options
  - selects new plan
  - confirms change
user_emotions: evaluating, cost_conscious
pain_points:
  - unclear proration
  - feature loss on downgrade
success_metrics:
  - plan_change_success_rate: >95%
  - user_understanding_of_impact: >90%

plan_change_ui:
  current_plan:
    name: "Founder"
    price: "$49/mo"
    features_highlight: "3 projects, unlimited analysis"

  available_plans:
    upgrade_option:
      name: "Consultant"
      price: "$149/mo"
      features:
        - "Everything in Founder"
        - "Client management"
        - "Portfolio dashboard"
        - "White-label reports"
      cta: "Upgrade to Consultant"

    downgrade_option:
      name: "Founder"
      price: "$49/mo"
      condition: "If currently Consultant"
      warning: "You will lose access to client management features"
      cta: "Downgrade to Founder"

  proration_explanation:
    upgrade:
      message: "You'll be charged a prorated amount of ${prorated_amount} today"
      detail: "This covers the difference for the remainder of your billing cycle"
    downgrade:
      message: "Your new rate takes effect at your next billing date"
      detail: "You'll continue to have Consultant access until {next_billing_date}"

  confirmation:
    upgrade:
      title: "Confirm Upgrade"
      charge_today: "${prorated_amount}"
      recurring: "$149/mo starting {next_billing_date}"
      cta: "Upgrade Now"
    downgrade:
      title: "Confirm Downgrade"
      warning: "You will lose access to: Client management, Portfolio dashboard, White-label reports"
      effective_date: "{next_billing_date}"
      cta: "Downgrade"
```

### Step 9: Switch Billing Cycle (US-B09)

```yaml
touchpoint: /settings/billing/cycle
user_state: optimizing_billing
user_goal: switch_to_annual_for_savings
user_actions:
  - sees "Switch to Annual" option
  - reviews savings calculation
  - confirms switch
  - pays annual amount
user_emotions: cost_conscious, committed
pain_points:
  - large upfront payment
  - unclear about switching back
success_metrics:
  - annual_conversion_rate: >15%
  - annual_retention_rate: >90%

cycle_change_ui:
  current_cycle:
    type: "Monthly"
    price: "$49/mo"
    total_annual: "$588/year"

  annual_option:
    type: "Annual"
    price: "$39/mo billed annually"
    total_annual: "$468/year"
    savings: "Save $120/year (20% off)"
    badge: "Most Popular"

  calculation:
    remaining_days: "15 days left in current cycle"
    credit: "Prorated credit: $24.50"
    charge_today: "$468.00 - $24.50 = $443.50"
    next_billing: "January 22, 2027"

  confirmation:
    title: "Switch to Annual Billing"
    charge: "$443.50 today"
    savings: "You'll save $120 over the next year"
    note: "You can switch back to monthly at the end of your annual term"
    cta: "Switch to Annual"

  switch_back:
    timing: "Available 30 days before annual renewal"
    prorating: "No refunds for early switch to monthly"
```

---

## Phase 5: Tax Compliance

### Step 10: View Tax Invoice (US-B07)

```yaml
touchpoint: /settings/billing/tax
user_state: needs_tax_documentation
user_goal: get_proper_tax_invoice
user_actions:
  - provides tax ID (VAT/GST number)
  - sees tax calculated on invoices
  - downloads tax-compliant invoice
user_emotions: administrative, compliance_focused
pain_points:
  - missing tax info
  - wrong jurisdiction
success_metrics:
  - tax_id_validation_accuracy: >99%
  - invoice_tax_compliance: 100%

tax_configuration_ui:
  tax_settings:
    header: "Tax Information"
    description: "Provide your tax ID for compliant invoices"

    fields:
      tax_id:
        label: "VAT/GST Number"
        placeholder: "GB123456789 or AU12345678901"
        validation: "Real-time format validation"
        verification: "VIES lookup for EU VAT"

      business_name:
        label: "Legal Business Name"
        placeholder: "Company Ltd"

      billing_address:
        required: true
        fields: ["Line 1", "Line 2", "City", "State", "Postal Code", "Country"]

    save_button: "Save Tax Information"

  tax_calculation:
    logic:
      eu_customer_with_vat: "Reverse charge (0% VAT)"
      eu_customer_no_vat: "Charge local VAT rate"
      uk_customer_with_vat: "Reverse charge (0% VAT)"
      uk_customer_no_vat: "Charge 20% VAT"
      australia_customer: "Charge 10% GST"
      us_customer: "No sales tax (SaaS exempt in most states)"
      other: "No VAT/GST"

  compliant_invoice:
    additional_fields:
      - "Seller VAT number"
      - "Buyer VAT number (if provided)"
      - "VAT/GST amount (itemized)"
      - "Reverse charge notice (if applicable)"
      - "Tax point date"

supported_jurisdictions:
  eu_vat:
    - "All 27 EU member states"
    - "VIES validation for VAT numbers"
    - "Reverse charge for B2B"

  uk_vat:
    - "United Kingdom"
    - "HMRC validation"
    - "Reverse charge for B2B"

  gst:
    - "Australia (10% GST)"
    - "ABN validation"

  future:
    - "Canada GST/HST/PST (planned)"
    - "India GST (planned)"
```

---

## Phase 6: Refunds & Promos

### Step 11: Request Refund (US-B05)

```yaml
touchpoint: /settings/billing/refund or support request
user_state: seeking_refund
user_goal: get_money_back
user_actions:
  - finds refund request option
  - submits refund request
  - waits for review
  - receives decision
user_emotions: dissatisfied, hopeful
pain_points:
  - unclear eligibility
  - slow process
success_metrics:
  - refund_request_resolution: <48 hours
  - eligible_refund_approval: 100%
  - refund_processing_time: <5 business days

refund_policy:
  eligibility:
    within_14_days:
      description: "Full refund, no questions asked"
      automatic: true
      amount: "100% of last payment"

    14_to_30_days:
      description: "Prorated refund based on usage"
      review_required: true
      criteria:
        - "Limited platform usage"
        - "Technical issues prevented use"
        - "Billing error"

    after_30_days:
      description: "Generally not eligible"
      exceptions:
        - "Documented technical failures"
        - "Billing errors on our part"
        - "Legal requirements"

  annual_subscriptions:
    within_30_days: "Full refund minus 1 month of usage"
    after_30_days: "Generally not eligible, case-by-case"

refund_request_ui:
  access:
    within_14_days: "Settings → Billing → Request Refund (self-service)"
    after_14_days: "Contact Support (reviewed)"

  self_service_form:
    eligibility_check: "Automatic based on payment date"
    fields:
      reason:
        options:
          - "Product didn't meet expectations"
          - "Technical issues"
          - "Billing error"
          - "Other"
      details: "Optional explanation"
    submit: "Request Refund"

  confirmation:
    immediate: "Refund request submitted"
    timeline: "Processed within 5-10 business days"
    method: "Credited to original payment method"

  review_process:
    for_reviewed_requests:
      - "Support team reviews within 48 hours"
      - "User notified of decision via email"
      - "If approved, refund processed within 5 days"
```

### Step 12: Apply Promo Code (US-B08)

```yaml
touchpoint: /settings/billing/promo or checkout
user_state: has_discount_code
user_goal: apply_discount_to_subscription
user_actions:
  - enters promo code
  - sees discount applied
  - confirms discounted price
user_emotions: savvy, satisfied
pain_points:
  - code doesn't work
  - unclear discount terms
success_metrics:
  - promo_redemption_rate: >80% (of valid codes)
  - code_validation_time: <2 seconds

promo_code_ui:
  entry_points:
    checkout: "During initial subscription"
    billing_settings: "Apply to existing subscription"

  promo_field:
    label: "Promo Code"
    placeholder: "Enter code"
    apply_button: "Apply"
    validation:
      valid: "Code applied! 30% off for 3 months"
      invalid: "Invalid or expired code"
      already_used: "You've already used this code"
      not_eligible: "This code doesn't apply to your plan"

  discount_display:
    before: "$49/mo"
    after: "$34.30/mo"
    duration: "for 3 months"
    total_savings: "Save $44.10"

  terms_display:
    discount_amount: "30% off"
    duration: "First 3 months"
    then: "Then $49/mo"
    stacking: "Cannot be combined with other offers"

promo_types:
  percentage:
    example: "30% off"
    duration: "Limited time or forever"

  fixed_amount:
    example: "$20 off"
    duration: "First month only"

  free_months:
    example: "1 month free"
    application: "Applied after first paid month"

  trial_extension:
    example: "30-day trial instead of 14"
    eligibility: "New users only"
```

---

## Success Metrics Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Payment success rate | >98% | Successful charges / attempts |
| Dunning recovery rate | >75% | Failed payments recovered within 14 days |
| Invoice download availability | 100% | All invoices downloadable |
| Tax compliance | 100% | Correct tax calculation and documentation |
| Refund processing time | <5 days | Request to funds returned |
| Plan change success | >95% | Completed plan changes |
| Annual conversion rate | >15% | Monthly users switching to annual |

---

## Stripe Integration Notes

| Feature | Stripe Product | Notes |
|---------|---------------|-------|
| Subscription management | Stripe Billing | Handles recurring charges |
| Payment methods | Stripe Elements | PCI-compliant card entry |
| Invoices | Stripe Invoicing | Automatic invoice generation |
| Tax calculation | Stripe Tax | Automatic VAT/GST calculation |
| Dunning | Stripe Smart Retries | Optimized retry schedule |
| Promo codes | Stripe Coupons | Managed discount codes |

---

## Cross-References

| Document | What It Covers |
|----------|---------------|
| [`roles/role-definitions.md`](../../roles/role-definitions.md) | Role definitions and billing tiers |
| [`stories/platform.md`](../../stories/platform.md) | Billing user stories (US-B01-B10) |
| [`offboarding-journey-map.md`](../platform/offboarding-journey-map.md) | Cancellation flows |
| [`support-journey-map.md`](../platform/support-journey-map.md) | Billing support requests |
| [`journey-test-matrix.md`](../../../testing/journey-test-matrix.md) | E2E test coverage |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Initial creation - 6-phase billing journey with compliance requirements |
