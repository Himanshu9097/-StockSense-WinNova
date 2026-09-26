STOCKSENSE — MASTER ENGINEERING PROMPT

You are building StockSense, an enterprise-grade inventory and warehouse execution platform for the Odoo Hackathon.
The product must NOT feel like a generic inventory CRUD application.

The core objective is to create a modern Warehouse Operating System that connects:
PRODUCTS → INVENTORY → LOCATIONS → RECEIVING → PUTAWAY → RESERVATION → PICKING → PACKING → SHIPPING → RETURNS → AUDITING → ANALYTICS.

SOURCE OF TRUTH
Use the supplied StockSense problem statement as the mandatory baseline.
The baseline requirements include:
authentication
dashboard
products
categories
reordering rules
receipts
delivery orders
internal transfers
stock adjustments
movement history
warehouse configuration
profile
low-stock alerts
multi-warehouse support
SKU search/filtering
stock ledger
Do not remove or weaken these capabilities.

PRODUCT DIFFERENTIATION
StockSense should extend the baseline with enterprise warehouse execution concepts:
warehouse hierarchy
exact bin-level inventory
chaotic storage
lot/batch tracking
serial tracking
FIFO/FEFO allocation
barcode/QR workflows
intelligent putaway
reservations
task management
wave picking
cluster picking
dynamic pick routing
packing verification
packaging recommendation
staging
carrier management
reverse logistics
return grading
blind cycle counting
ABC/FSN classification
intelligent replenishment
warehouse heatmap
warehouse digital twin
congestion awareness
labor/task visibility
operational exceptions
SLA monitoring
immutable audit trail
AI warehouse copilot
anomaly detection
operational control tower
event stream
traceability graph

AUTHENTICATION IMPLEMENTATION SCOPE
Implement the authentication system completely.
Implement:
Login
Signup
Email verification architecture
Forgot password
OTP
Password reset
Logout
Session management
Refresh token/session architecture
Protected routes
RBAC foundation
Organization/workspace creation
User profile
Security events
Login audit history
API validation
Rate limiting
Secure password hashing
Authentication error handling

Do NOT implement all application modules during the authentication-first phase.
Instead, create clean interfaces and module boundaries so the future inventory system can plug in without architectural rewrites.

DESIGN DIRECTION
StockSense must have a completely different visual identity from DealFlow360.
Do NOT copy:
DealFlow360 split-screen login
DealFlow360 rose/pink branding
DealFlow360 draggable login divider
DealFlow360 typography/layout
DealFlow360 component patterns
DealFlow360 visual hierarchy
DealFlow360 decorative treatment

Create a new warehouse-operations visual identity.
Recommended palette:
Background: #08111F
Surface: #0F1B2D
Surface elevated: #13233A
Primary: #38BDF8
Success: #22C55E
Warning: #F59E0B
Danger: #F43F5E
Text primary: #F8FAFC
Text secondary: #94A3B8
Borders: rgba(255,255,255,0.08)

The product should feel:
precise, operational, intelligent, enterprise, technical, calm, modern
Avoid excessive neon, generic SaaS gradients, excessive glassmorphism, cartoon illustrations, and unnecessary decoration.

LOGIN DESIGN
Create a command-center style login.
Desktop layout:
centered authentication workspace
surrounding operational visualization
warehouse grid
subtle location nodes
route animations
system status indicators
compact metrics
authentication card
The visualization must support the product story.
Example surrounding status:
SYSTEM ONLINE
12 ACTIVE WAREHOUSES
98.7% INVENTORY ACCURACY
1,284 OPEN TASKS

Use subtle animation.
Animation should represent:
inventory movement, warehouse routes, scanning, synchronization, data flow
Respect prefers-reduced-motion.

SIGNUP DESIGN
Signup is a workspace creation experience.
Step 1: Personal details
Step 2: Organization
Step 3: Role
Step 4: Verification
Step 5: Workspace created
Do not make signup look like a generic registration form.

AUTH ROUTES
Create:
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/reset-password
GET /api/auth/me
GET /api/auth/sessions
DELETE /api/auth/sessions/:id

DATABASE FOUNDATION
Use PostgreSQL.
Create entities:
User, Organization, Membership, Role, Permission, Session, VerificationToken, PasswordResetToken, LoginAttempt, SecurityEvent
Use UUID identifiers.
Never store plaintext passwords or plaintext OTPs.

SECURITY
Use:
Argon2id or bcrypt with strong parameters
short-lived access tokens
refresh/session mechanism
secure cookies when applicable
rate limiting
OTP expiration
OTP attempt limits
password strength validation
session revocation
audit events
input validation
centralized API error handling
CORS configuration
environment variables for secrets

ARCHITECTURE
Use feature-oriented modular architecture.
Frontend: React + TypeScript + Vite.
Use: Tailwind, Framer Motion, Lucide, React Hook Form, Zod, TanStack Query
Backend: Node.js + TypeScript + Express.
Database: PostgreSQL.
Optional: Redis for sessions, rate limiting and future event processing.

CODE QUALITY
Never create giant monolithic components.
Keep: feature boundaries, reusable UI, typed API clients, validation schemas, service layers, repository/data access layers, centralized error handling
Every significant feature must have: types, validation, service, controller, route, tests

FUTURE MODULE CONTRACTS
Architect interfaces for:
inventory, warehouses, locations, products, receiving, putaway, picking, packing, shipping, returns, cycle counting, procurement, analytics, AI
Do not implement these modules yet unless explicitly requested.

UX PRINCIPLES
Every important action should communicate:
WHAT happened, WHY it happened, WHERE it happened, WHO caused it, WHAT happens next
For inventory operations, preserve complete traceability.

ACCEPTANCE CRITERIA
The authentication phase is complete only when:
user can signup, organization is created, membership is created, password is securely stored, email verification architecture works, login works, invalid credentials are handled correctly, OTP reset flow works, sessions can be revoked, protected routes work, roles/permissions foundation works, auth events are logged, API validation works, rate limiting exists, frontend is responsive, animations are polished, accessibility basics are satisfied, mobile login works, no DealFlow360 visual patterns are reused, tests pass.

IMPORTANT
Do not fake enterprise behavior with static UI.
Where backend functionality is requested, implement real API/database behavior.
Where future modules are not implemented, create documented interfaces and placeholders rather than pretending they are functional.
The final application must be extensible toward a full warehouse management platform.

First create/read the project documentation.
Then scaffold the architecture.
Then implement authentication.
Then write tests.
Then run build/lint/test.
Do not skip validation.
