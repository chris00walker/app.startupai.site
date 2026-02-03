---
purpose: "All UI text and microcopy for Portfolio Holder marketplace"
status: "active"
created: "2026-02-03"
last_reviewed: "2026-02-03"
story: "US-PH01-07, US-FM01-11"
---

# Marketplace Microcopy Specification

This document contains all UI text for the Portfolio Holder marketplace features.

## Terminology

| Internal Term | UI Label | Context |
|---------------|----------|---------|
| Portfolio Holder | Consultant | All user-facing contexts |
| Verification Status | Verified Badge | Profile display |
| Connection Request | Request | Notifications, lists |
| RFQ | Request for Quote | Feature name |

## Dashboard Notifications

### Connection Requests Card

**Title:** "Connection Requests"

**Body (plural):** "You have {count} pending connection requests from consultants."

**Body (singular):** "You have 1 pending connection request from a consultant."

**CTA:** "View Requests"

### RFQ Responses Card (Founder)

**Title:** "RFQ Responses"

**Body (plural):** "You have {count} new responses to your requests."

**Body (singular):** "You have 1 new response to your request."

**CTA:** "View Responses"

## Directory Browsing

### Founder Directory (Consultant View)

**Page Title:** "Founder Directory"

**Empty State:**
> "No founders match your filters. Try broadening your search."

**Filter Labels:**
- Industry: "Filter by industry"
- Stage: "Filter by stage"
- Problem Fit: "Filter by validation status"

**Card Elements:**
- Anonymized name: "{First Initial}. {Last Initial}." (e.g., "S. J.")
- Company placeholder: "Validated startup"
- Evidence badges: "{count} interviews" • "{count} experiments" • "Fit: {score}%"

### Consultant Directory (Founder View)

**Page Title:** "Consultant Directory"

**Empty State:**
> "No consultants match your filters. Try broadening your search."

**Filter Labels:**
- Relationship Type: "Type of help"
- Industry: "Industry expertise"
- Services: "Services offered"

**Card Elements:**
- Verification badge: "Verified" or "Grace Period"
- Connection count: "{count} active connections"

## Connection Request Flow

### Request Button States

**Available:** "Request Connection"

**Cooldown Active:** "Available in {days} days" (disabled, with tooltip)

**Already Connected:** "Connected" (disabled)

**Request Pending:** "Request Pending" (disabled)

### Request Modal

**Title (Consultant → Founder):** "Request Connection"

**Body:**
> "Send a connection request to {Founder Name}. They'll be notified and can accept or decline."

**Relationship Type Label:** "Relationship Type"

**Relationship Type Help:**
| Type | Help Text |
|------|-----------|
| Advisory | "Strategic guidance. Mentors, coaches, fractional executives." |
| Capital | "Funding support. Angels, VCs, family offices." |
| Program | "Cohort-based support. Accelerators, incubators." |
| Service | "Professional support. Lawyers, accountants, agencies." |
| Ecosystem | "Community and networking. Coworking, startup communities." |

**Message Label:** "Message (optional)"

**Message Placeholder:** "Introduce yourself and explain why you'd like to connect..."

**CTA:** "Send Request"

### Accept Modal

**Title:** "Confirm Connection"

**Body:**
> "Connect with {Name} as {Relationship Type} Consultant?"

**Consent Text:**
> "By accepting, you agree to share your validation evidence with this consultant. They will be able to:
> - View your Value Proposition Canvas
> - See your experiment results and evidence
> - Track your validation progress
>
> You can end this relationship at any time from Settings."

**CTA:** "Confirm"

**Cancel:** "Cancel"

### Accept Success

**Toast Title:** "Connection established"

**Toast Body:** "You're now connected with {Name}. They can view your validation evidence and track your progress."

### Decline Modal

**Title:** "Decline Request"

**Body:**
> "Are you sure you want to decline this request from {Name}?"

**Reason Label:** "Reason (optional)"

**Reason Options:**
- "Not the right fit for my needs"
- "Timing isn't right"
- "Already working with another advisor"
- "Other"

**Cooldown Notice:**
> "This consultant can send a new request after 30 days."

**CTA:** "Decline"

**Cancel:** "Cancel"

### Decline Success

**Toast Title:** "Request declined"

**Toast Body:** "{Name} can send a new request after {Date}."

### Cooldown Error

**Toast Title:** "Request unavailable"

**Toast Body:** "You can reconnect with this founder in {days} days."

## RFQ Flow

### Create RFQ Form

**Page Title:** "Create Request for Quote"

**Section Title:** "What are you looking for?"

**Field Labels:**
- Title: "Title"
- Description: "Description"
- Type: "Type of Help Needed"
- Industries: "Industries (optional)"
- Stage: "Stage Preference (optional)"
- Timeline: "Timeline (optional)"
- Budget: "Budget Range (optional)"

**Field Placeholders:**
- Title: "e.g., Seeking seed funding advisor"
- Description: "Describe what you're looking for and any relevant context about your startup..."

**Visibility Notice:**
> "Your RFQ will be visible to verified consultants for 30 days. Only consultants matching your criteria will see it."

**CTA:** "Post RFQ"

### Create RFQ Success

**Title:** "RFQ Posted Successfully"

**Body:** "Your request is now visible to verified consultants. You'll be notified when you receive responses."

**CTA:** "View My RFQs"

### RFQ Board (Consultant)

**Page Title:** "RFQ Board"

**Filter Labels:**
- Type: "Type"
- Industry: "Industry"
- Timeline: "Timeline"
- Budget: "Budget"

**Empty State:**
> "No requests match your filters. Try broadening your search or check back later."

**Card Elements:**
- Posted: "Posted {time} ago"
- Responses: "{count} responses"
- Expires: "Expires in {days} days"

**Button States:**
- Available: "Respond"
- Already Responded: "Response Sent ({time} ago)"

### Unverified Consultant (RFQ Board)

**Title:** "Verification Required"

**Body:**
> "Upgrade to Advisor ($199/mo) or Capital ($499/mo) to browse founder requests and respond to RFQs."

**CTA:** "Upgrade Now"

### Respond to RFQ Modal

**Title:** "Respond to Request"

**Message Label:** "Your Message"

**Message Placeholder:** "Introduce yourself and explain why you're a good fit for this request..."

**Profile Notice:**
> "Your response will include your profile information. Make sure your profile is complete and up to date."

**CTA:** "Send Response"

### Respond Success

**Toast Title:** "Response sent"

**Toast Body:** "The founder will be notified of your response."

### Accept RFQ Response Modal

**Title:** "Accept Response"

**Body:**
> "Connect with {Name} as {Type} Consultant?"

**Consent Text:**
> "By accepting, you agree to share your validation evidence with this consultant and establish a professional relationship."

**Fill Option:** "Mark this RFQ as filled (hides from other consultants)"

**CTA:** "Accept"

### Decline RFQ Response Modal

**Title:** "Decline Response"

**Body:**
> "Are you sure you want to decline this response from {Name}?"

**Reason Label:** "Reason (optional)"

**Reason Options:**
- "Not the right fit"
- "Went with another consultant"
- "Other"

**CTA:** "Decline"

## Marketplace Settings

### Consultant Settings Tab

**Tab Label:** "Marketplace"

**Section: Directory Visibility**

**Toggle Label:** "List me in the Consultant Directory"

**Toggle Help:**
> "When enabled, founders can discover you in the Consultant Directory and request connections."

**Default Type Label:** "Default Relationship Type"

**Default Type Help:**
> "This will be pre-selected when founders request connections with you."

**Verification Status Label:** "Verification Status"

**Verification Status Values:**
- Verified: "Verified - Full marketplace access"
- Grace: "Grace Period - {days} days remaining"
- Unverified: "Unverified - Upgrade to access marketplace"
- Revoked: "Revoked - Update payment to restore access"

### Founder Settings Tab

**Tab Label:** "Marketplace"

**Section: Directory Visibility**

**Toggle Label:** "List me in the Founder Directory"

**Toggle Help:**
> "When enabled, verified consultants can discover you in the Founder Directory based on your validation progress."

**Requirement Notice (if not qualified):**
> "Complete more validation to qualify for the Founder Directory. You need at least partial problem-solution fit."

**Qualified Notice:**
> "You qualify for the Founder Directory with {fit_status} fit status."

## Verification Events

### Verification Granted

**Toast Title:** "You're now verified"

**Toast Body:** "Access the Founder Directory and start reviewing validated founders."

### Grace Period Started

**Toast Title:** "Payment issue detected"

**Toast Body:** "Update your payment method within 7 days to maintain marketplace access."

### Verification Revoked

**Toast Title:** "Marketplace access paused"

**Toast Body:** "Update your payment method to restore access to the Founder Directory and RFQ Board."

## Error Messages

| Error | User Message |
|-------|--------------|
| `cooldown_active` | "You can reconnect with this {role} in {days} days." |
| `unverified` | "Upgrade to access this feature." |
| `already_connected` | "You're already connected with this {role}." |
| `already_responded` | "You've already responded to this request." |
| `rfq_expired` | "This request is no longer accepting responses." |
| `rfq_filled` | "This request has been filled." |
| `not_qualified` | "Complete more validation to access the Founder Directory." |

## Confirmation Dialogs

### Cancel RFQ

**Title:** "Cancel Request"

**Body:** "Are you sure you want to cancel this request? This cannot be undone."

**CTA:** "Cancel RFQ"

### End Connection

**Title:** "End Connection"

**Body:** "Are you sure you want to end your connection with {Name}? They will no longer have access to your validation evidence."

**CTA:** "End Connection"

## Cross-References

- [portfolio-holder.md](../user-experience/stories/portfolio-holder.md) - User stories
- [connection-request-ux.md](../user-experience/wireframes/connection-request-ux.md) - Connection UX
- [rfq-flow.md](../user-experience/wireframes/rfq-flow.md) - RFQ UX
