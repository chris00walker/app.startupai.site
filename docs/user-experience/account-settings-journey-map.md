---
purpose: "Complete account settings journey map for profile and security management"
status: "active"
last_reviewed: "2026-01-22"
---

# Complete Account Settings Journey Map

**End-to-End User Experience Specification**

**Status:** Active
**Last Updated:** 2026-01-22
**Persona Reference:** All user types (Founder, Consultant, Trial, Admin)

---

## Document Purpose

This document maps the complete account settings journey including profile management, password changes, two-factor authentication, and security features. This is a **cross-cutting journey** that applies to all user roles.

**Settings Promise:** "Your account, your control"
**Security Promise:** "Keep your account safe with modern security features"

---

## Journey Overview

The Account Settings journey consists of 5 phases covering account management and security:

| Phase | Focus | Key Workflows | Stories |
|-------|-------|---------------|---------|
| Phase 1 | Profile | Update name, email, avatar | US-AS01 |
| Phase 2 | Password | Change password, forgot password | US-AS02 |
| Phase 3 | Two-Factor Auth | Enable/disable 2FA | US-AS03 |
| Phase 4 | Login History | View security events | US-AS04 |
| Phase 5 | Connected Devices | Manage active sessions | US-AS05 |

---

## Settings Navigation

```
/settings
    │
    ├── /settings/profile      ← Phase 1: Profile
    │
    ├── /settings/security     ← Phase 2-5: Security
    │       ├── Password
    │       ├── Two-Factor Authentication
    │       ├── Login History
    │       └── Connected Devices
    │
    ├── /settings/billing      ← See billing-journey-map.md
    │
    ├── /settings/notifications ← See notification-journey-map.md
    │
    └── /settings/privacy      ← See support-journey-map.md (GDPR)
```

---

## Phase 1: Profile Management

### Step 1: View Profile (US-AS01)

```yaml
touchpoint: /settings/profile
user_state: reviewing_profile
user_goal: see_current_profile_info
user_actions:
  - navigates to Settings
  - views profile section
  - reviews current information
user_emotions: administrative, curious
pain_points:
  - unclear what can be changed
  - out of date information
success_metrics:
  - profile_page_load: <2 seconds
  - profile_completeness: >80%

profile_view_ui:
  layout: "two-column: avatar + fields"

  avatar_section:
    current_avatar: "User photo or initials"
    change_button: "Change photo"
    remove_button: "Remove" (if custom photo)

  profile_fields:
    display_name:
      label: "Display Name"
      value: "{current name}"
      editable: true

    email:
      label: "Email Address"
      value: "{current email}"
      editable: true
      note: "Changing email requires verification"

    company:
      label: "Company Name"
      value: "{current company}"
      editable: true
      optional: true

    role_display:
      label: "Account Type"
      value: "Founder | Consultant | Admin"
      editable: false
      note: "Contact support to change"

    member_since:
      label: "Member Since"
      value: "{signup date}"
      editable: false

    timezone:
      label: "Timezone"
      value: "{current timezone}"
      editable: true
      note: "Used for notifications and reports"
```

### Step 2: Update Profile (US-AS01)

```yaml
touchpoint: /settings/profile (edit mode)
user_state: editing_profile
user_goal: update_personal_information
user_actions:
  - clicks "Edit" or field
  - updates information
  - clicks "Save Changes"
  - sees confirmation
user_emotions: administrative
pain_points:
  - unsaved changes lost
  - email change complexity
success_metrics:
  - profile_update_success: >99%
  - time_to_update: <2 minutes

profile_edit_ui:
  edit_mode:
    trigger: "Click on field or Edit button"
    indicator: "Fields become editable"

  fields:
    display_name:
      input_type: "text"
      validation: "2-100 characters"
      error: "Name must be 2-100 characters"

    email:
      input_type: "email"
      validation: "Valid email format"
      change_flow:
        step_1: "Enter new email"
        step_2: "Verify current password"
        step_3: "Verification email sent to new address"
        step_4: "Click verification link"
        step_5: "Email updated"
      warning: "You'll need to verify your new email address"

    company:
      input_type: "text"
      validation: "0-200 characters"
      optional: true

    timezone:
      input_type: "select"
      options: "All standard timezones"
      default: "Detected from browser"

  avatar_upload:
    trigger: "Click avatar or 'Change photo'"
    accepted_formats: ["jpg", "png", "gif"]
    max_size: "5MB"
    crop_tool: "Square crop with preview"
    processing: "Resize to 200x200"

  save_flow:
    save_button: "Save Changes"
    loading: "Saving..."
    success: "Profile updated successfully"
    error: "Unable to save. Please try again."

  unsaved_changes:
    detection: "Track form dirty state"
    warning: "You have unsaved changes. Leave anyway?"
```

---

## Phase 2: Password Management

### Step 3: Change Password (US-AS02)

```yaml
touchpoint: /settings/security
user_state: updating_password
user_goal: set_new_secure_password
user_actions:
  - navigates to Security settings
  - clicks "Change Password"
  - enters current password
  - enters new password twice
  - clicks "Update Password"
user_emotions: security_conscious, careful
pain_points:
  - forgot current password
  - password requirements unclear
success_metrics:
  - password_change_success: >95%
  - password_strength_adoption: >80% (strong passwords)

password_change_ui:
  location: "/settings/security (Password section)"

  current_display:
    label: "Password"
    value: "Last changed {date}" or "Never changed"
    cta: "Change Password"

  change_form:
    current_password:
      label: "Current Password"
      type: "password"
      visibility_toggle: true
      forgot_link: "Forgot password?"

    new_password:
      label: "New Password"
      type: "password"
      visibility_toggle: true
      strength_indicator:
        levels: ["Weak", "Fair", "Good", "Strong"]
        colors: ["red", "amber", "green", "green"]
        minimum: "Fair"

    requirements:
      display: "Below new password field"
      items:
        - "At least 8 characters"
        - "At least one uppercase letter"
        - "At least one number"
        - "At least one special character"
      validation: "Real-time checkmarks"

    confirm_password:
      label: "Confirm New Password"
      type: "password"
      visibility_toggle: true
      validation: "Must match new password"

    submit_button:
      text: "Update Password"
      loading: "Updating..."
      disabled_until: "All requirements met"

  success_flow:
    message: "Password updated successfully"
    action: "Sign out other devices?" (optional)
    email: "Password change notification sent"

  forgot_password_flow:
    trigger: "Click 'Forgot password?'"
    action: "Send password reset email"
    confirmation: "Reset link sent to {email}"
```

### Step 4: Forgot Password Flow (US-AS02)

```yaml
touchpoint: /forgot-password or /login
user_state: cannot_remember_password
user_goal: regain_account_access
user_actions:
  - clicks "Forgot password?" on login page
  - enters email address
  - receives reset email
  - clicks reset link
  - sets new password
  - logs in with new password
user_emotions: frustrated, hopeful
pain_points:
  - email might go to spam
  - reset link might expire
success_metrics:
  - reset_email_delivery: >99%
  - reset_completion_rate: >80%
  - time_to_reset: <5 minutes

forgot_password_ui:
  step_1_request:
    url: "/forgot-password"
    title: "Reset your password"
    subtitle: "Enter your email and we'll send you a reset link"
    email_field:
      placeholder: "you@example.com"
      validation: "Valid email format"
    submit_button: "Send Reset Link"
    back_link: "Back to login"

  step_2_confirmation:
    title: "Check your email"
    message: "We've sent a password reset link to {email}"
    note: "Link expires in 1 hour"
    help: "Didn't receive it? Check spam or try again"
    resend_button: "Resend email" (after 60 seconds)

  step_3_reset:
    url: "/reset-password?token={token}"
    title: "Set new password"
    new_password_field: "Same as change password form"
    confirm_password_field: "Same as change password form"
    submit_button: "Reset Password"

  step_4_success:
    title: "Password reset!"
    message: "Your password has been updated"
    cta: "Sign in with new password"

security:
  token_expiry: "1 hour"
  token_single_use: true
  rate_limit: "3 requests per hour per email"
  notification: "Email sent to confirm password was reset"
```

---

## Phase 3: Two-Factor Authentication

### Step 5: Enable 2FA (US-AS03)

```yaml
touchpoint: /settings/security
user_state: securing_account
user_goal: add_extra_security_layer
user_actions:
  - navigates to Security settings
  - clicks "Enable 2FA"
  - scans QR code with authenticator app
  - enters verification code
  - saves backup codes
  - 2FA is enabled
user_emotions: security_conscious, methodical
pain_points:
  - QR code scanning issues
  - backup codes management
success_metrics:
  - 2fa_setup_completion: >90%
  - 2fa_adoption_rate: >20%

2fa_enable_ui:
  location: "/settings/security (Two-Factor Authentication section)"

  current_display:
    enabled: "2FA is enabled (green badge)"
    disabled: "2FA is not enabled (amber warning)"
    cta: "Enable" or "Disable"

  setup_flow:
    step_1_intro:
      title: "Set up two-factor authentication"
      description: "Add an extra layer of security to your account"
      supported_apps:
        - "Google Authenticator"
        - "Authy"
        - "1Password"
        - "Any TOTP-compatible app"
      cta: "Get Started"

    step_2_scan:
      title: "Scan QR code"
      qr_code: "Generated TOTP secret"
      manual_entry:
        label: "Can't scan? Enter code manually:"
        secret: "{base32 secret}"
      instruction: "Open your authenticator app and scan this code"

    step_3_verify:
      title: "Enter verification code"
      description: "Enter the 6-digit code from your authenticator app"
      code_input:
        type: "6 digit OTP"
        auto_submit: true (on 6 digits)
      error: "Invalid code. Please try again."
      submit: "Verify"

    step_4_backup_codes:
      title: "Save your backup codes"
      description: "Store these codes somewhere safe. You can use them if you lose access to your authenticator app."
      codes: "10 single-use codes displayed"
      actions:
        download: "Download codes"
        copy: "Copy to clipboard"
        regenerate: "Generate new codes"
      warning: "Each code can only be used once"
      acknowledgment: "I have saved these codes"
      submit: "Complete Setup"

    step_5_success:
      title: "2FA enabled!"
      message: "Your account is now protected with two-factor authentication"
      next_login: "You'll need your authenticator app when you sign in"

2fa_methods:
  supported:
    - "TOTP (Authenticator apps)"
  planned:
    - "SMS (not recommended)"
    - "Security keys (WebAuthn)"
```

### Step 6: Disable 2FA (US-AS03)

```yaml
touchpoint: /settings/security
user_state: removing_2fa
user_goal: disable_2fa_if_needed
user_actions:
  - clicks "Disable 2FA"
  - confirms with password
  - optionally enters reason
  - 2FA is disabled
user_emotions: deliberate, possibly_frustrated
pain_points:
  - locked out of authenticator
  - need to disable temporarily
success_metrics:
  - disable_success_rate: 100%
  - accidental_disable_rate: <5%

2fa_disable_ui:
  trigger: "Disable Two-Factor Authentication"

  confirmation_modal:
    title: "Disable two-factor authentication?"
    warning: "This will make your account less secure"
    password_field: "Enter your password to confirm"
    reason_field:
      optional: true
      placeholder: "Why are you disabling 2FA?"
    cta_danger: "Disable 2FA"
    cta_cancel: "Keep 2FA Enabled"

  success:
    message: "2FA has been disabled"
    recommendation: "We recommend re-enabling 2FA for security"
    email_notification: "Security alert: 2FA was disabled"
```

---

## Phase 4: Login History

### Step 7: View Login History (US-AS04)

```yaml
touchpoint: /settings/security
user_state: reviewing_security
user_goal: check_for_suspicious_activity
user_actions:
  - navigates to Security settings
  - views recent login activity
  - checks for unfamiliar locations/devices
  - optionally signs out suspicious sessions
user_emotions: vigilant, security_aware
pain_points:
  - hard to identify own devices
  - unclear what's suspicious
success_metrics:
  - login_history_view_rate: >30%
  - suspicious_activity_detection: >90%

login_history_ui:
  location: "/settings/security (Login History section)"

  table:
    columns:
      date_time: "When"
      device: "Device"
      location: "Location"
      ip_address: "IP Address"
      status: "Status"

    status_indicators:
      current: "This device (green)"
      success: "Successful (green)"
      failed: "Failed attempt (red)"
      suspicious: "Unusual activity (amber)"

    row_actions:
      current_session: null
      other_sessions: "Sign out"

  filters:
    date_range: "Last 7 days | 30 days | 90 days"
    status: "All | Successful | Failed"

  alerts:
    new_device:
      message: "New device detected"
      detail: "Login from {device} in {location}"
      time: "{timestamp}"
    unusual_location:
      message: "Unusual location"
      detail: "Login from {location} (different from usual)"
      action: "Was this you?"

  empty_state:
    message: "No login history available"
    note: "Login history is retained for 90 days"

data_retention:
  login_history: "90 days"
  failed_attempts: "30 days"
  security_events: "1 year"
```

---

## Phase 5: Connected Devices

### Step 8: Manage Connected Devices (US-AS05)

```yaml
touchpoint: /settings/security
user_state: managing_sessions
user_goal: control_which_devices_are_signed_in
user_actions:
  - views list of connected devices
  - identifies unfamiliar devices
  - signs out specific devices or all
user_emotions: in_control, security_focused
pain_points:
  - can't identify devices by name
  - accidentally sign out own device
success_metrics:
  - device_management_adoption: >25%
  - remote_signout_success: 100%

connected_devices_ui:
  location: "/settings/security (Connected Devices section)"

  device_list:
    layout: "cards, one per device"

    device_card:
      device_name: "Chrome on macOS" or "Mobile App on iPhone"
      device_icon: "Laptop | Phone | Tablet"
      location: "San Francisco, CA"
      last_active: "Active now" or "3 days ago"
      current_badge: "This device" (green badge)
      ip_address: "Shown on hover/click"

    actions:
      sign_out: "Sign out" (individual device)
      sign_out_all: "Sign out all other devices"

  sign_out_flow:
    individual:
      confirmation: "Sign out this device?"
      detail: "{device_name} will need to sign in again"
      cta: "Sign Out"

    all_others:
      confirmation: "Sign out all other devices?"
      detail: "You'll stay signed in on this device only"
      warning: "This will sign out {N} devices"
      cta: "Sign Out All"

  success:
    individual: "Device signed out"
    all: "All other devices signed out"

  empty_state:
    message: "Only this device is signed in"

automatic_signout:
  inactive_session: "30 days"
  password_change: "Optionally sign out all devices"
  security_event: "Automatic if suspicious activity detected"
```

---

## Security Notifications

All security-related changes trigger notifications:

| Event | In-App | Email | Cannot Disable |
|-------|--------|-------|----------------|
| Password changed | Yes | Yes | Yes |
| Email changed | Yes | Yes (both old/new) | Yes |
| 2FA enabled | Yes | Yes | Yes |
| 2FA disabled | Yes | Yes | Yes |
| New device login | No | Yes | No |
| Failed login attempts (3+) | Yes | Yes | Yes |
| Session signed out remotely | - | Yes | Yes |

---

## Success Metrics Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Profile completion rate | >80% | Fields filled / total fields |
| 2FA adoption rate | >20% | Users with 2FA / total users |
| Password strength score | >80% strong | Strong passwords / password changes |
| Security settings visits | >30% | Users who visit security page |
| Suspicious activity detection | >90% | Flagged logins that were actually suspicious |

---

## Cross-References

| Document | What It Covers |
|----------|---------------|
| [`user-personas.md`](./user-personas.md) | Role definitions |
| [`user-stories.md`](./user-stories.md#account-settings-stories-us-as) | Account settings user stories (US-AS01-AS05) |
| [`billing-journey-map.md`](./billing-journey-map.md) | Billing settings |
| [`notification-journey-map.md`](./notification-journey-map.md) | Notification preferences |
| [`support-journey-map.md`](./support-journey-map.md) | Privacy settings and GDPR |
| [`journey-test-matrix.md`](../testing/journey-test-matrix.md) | E2E test coverage |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Initial creation - 5-phase account settings journey with security features |
