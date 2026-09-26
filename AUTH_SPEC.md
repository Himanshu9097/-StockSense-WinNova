STOCKSENSE AUTH SPECIFICATION

Authentication methods
Primary: Email + password
Future-ready: Google OAuth, Microsoft OAuth, Passkeys/WebAuthn

Signup
Required fields: name, email, password, password confirmation, organization name, role
Optional: phone, country, industry

Password
Requirements: minimum 12 characters
Must support: upper case, lower case, number, symbol
Do not reject long passphrases.

Login
Steps: validate credentials, verify account state, create authenticated session, create security event, return authenticated state

OTP
Six digits.
Expiration: 10 minutes.
Maximum failed attempts: 5
Resend cooldown: 60 seconds.
Store only a hashed OTP.

Password Reset
email → OTP → verify → password → revoke old sessions → success

Session management
Each session records: device, browser, IP, created_at, last_seen_at, expires_at, revoked_at

Security Events
Examples: LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, PASSWORD_RESET_REQUESTED, PASSWORD_RESET_COMPLETED, EMAIL_VERIFIED, SESSION_REVOKED, PASSWORD_CHANGED, ROLE_CHANGED

Error handling
Never reveal: "email exists" during signup.
Avoid account enumeration.
Use generic authentication errors.

Protected routes
Public: /login, /signup, /forgot-password, /reset-password
Protected: everything inside authenticated application.
