# External WhatsApp and SMS Setup

The desktop ERP sends WhatsApp and SMS only through ERP-Management Communication Gateway. It does not store Meta tokens, MSG91 auth keys, webhook secrets or database credentials.

## Desktop Configuration

1. In ERP-Management, open the school profile.
2. Generate a Communication Gateway device token for this desktop device/license.
3. Copy the token immediately. It is shown once.
4. In the desktop ERP, open General Settings -> Communication Integrations.
5. Enter the Gateway URL and device token.
6. Save and run Test Gateway.

The token is encrypted in local SQLite using Electron `safeStorage` when available. The stored token is never returned through `window.erpApi`.

## WhatsApp Services

Open WhatsApp -> WhatsApp Services.

Available tabs:

- Send Message
- Bulk/Class Message
- Templates
- Delivery Logs
- Configuration Status

Only approved templates from ERP-Management can be used. The ERP does not send arbitrary WhatsApp text outside approved Meta templates.

## SMS Gateway

Open SMS Services -> SMS Gateway or SMS Templates.

External provider charges and DLT registration may apply.

Only approved MSG91 Flow/DLT template mappings from ERP-Management can be used. The desktop cannot edit provider secrets.

## Recipient Handling

The desktop resolves recipients from local data:

- Student mobile
- Primary linked guardian mobile
- Legacy guardian/student mobile fallback
- Employee mobile

Phone numbers are normalized for India as `+91XXXXXXXXXX` only for delivery. Original ERP phone fields are not overwritten.

## Security Rules

- Student accounts cannot send external messages.
- Viewer accounts cannot send external messages.
- Owner/Admin can configure the gateway.
- Accountant and Teacher sends are limited by server-side template category checks.
- Batch sends require preview and confirmation.
- External failures do not change local fee, attendance, homework, report-card or announcement records.

## Mock Testing

In ERP-Management, set:

```bash
COMMUNICATION_PROVIDER_MODE=mock
```

Mock mode creates fake provider IDs and simulated statuses. It never sends real WhatsApp or SMS messages.

## Live Setup Still Required

For live delivery, configure in ERP-Management:

- Meta WhatsApp Business Account ID
- Meta Phone Number ID
- Meta permanent/system-user access token
- Meta app secret and webhook verify token
- Approved WhatsApp templates
- MSG91 auth key
- MSG91 Sender ID/Header
- DLT Principal Entity ID
- MSG91 Flow IDs and DLT Template IDs

Do not test live delivery until provider credentials, DLT approval and template approval are complete.
