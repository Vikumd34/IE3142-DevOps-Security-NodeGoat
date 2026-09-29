# NodeGoat STRIDE Threat Model

## 1. Scope

This threat model covers the local containerised NodeGoat application used for the IE3142 DevOps Security assignment.

The assessed architecture contains:

- User / Web Browser
- NodeGoat Node.js and Express web application
- Application routes and request handlers
- Data Access Objects (DAO)
- MongoDB 4.4 database
- Docker Compose environment

The main external trust boundary exists between the user's web browser and the Docker Compose environment hosting NodeGoat.

## 2. STRIDE Categories

| Category | Meaning |
|---|---|
| Spoofing | Pretending to be another user or identity |
| Tampering | Unauthorised modification of data |
| Repudiation | Performing actions without sufficient evidence or accountability |
| Information Disclosure | Exposure of information to unauthorised users |
| Denial of Service | Making the application or service unavailable |
| Elevation of Privilege | Gaining permissions that the user should not have |

## 3. Risk Assessment Method

Likelihood and impact are each rated using a 3-point scale:

- 1 = Low
- 2 = Medium
- 3 = High

Risk Score = Likelihood × Impact

Risk levels:

- 1–2 = Low
- 3–4 = Medium
- 6–9 = High

### 3×3 Risk Matrix

| Impact ↓ / Likelihood → | 1 - Low | 2 - Medium | 3 - High |
|---|---:|---:|---:|
| 3 - High | 3 Medium | 6 High | 9 High |
| 2 - Medium | 2 Low | 4 Medium | 6 High |
| 1 - Low | 1 Low | 2 Low | 3 Medium |

## 4. Application-Specific Threats

Threats identified from the NodeGoat architecture and source code will be documented below.
### T1 — Account Spoofing Through Weak Password Protection

- **STRIDE Category:** Spoofing
- **Affected Component:** User authentication and MongoDB users collection
- **Threat Scenario:** If stored user credentials are exposed, weak password storage can allow an attacker to recover a user's password and impersonate that user.
- **Existing Observation:** The inspected `user-dao.js` performs direct password comparison, while bcrypt-based password hashing is present only in commented example fix code.
- **Likelihood:** 3 (High)
- **Impact:** 3 (High)
- **Risk Score:** 9
- **Risk Level:** High
- **Proposed Control:** Store passwords using salted one-way password hashing and verify passwords using the password-hashing library rather than direct comparison.
- **Control Location:** `app/data/user-dao.js`

### T2 — Unauthorised Access to Administrative Benefits Functions

- **STRIDE Category:** Elevation of Privilege
- **Affected Component:** Benefits routes and benefits request handler
- **Threat Scenario:** An authenticated non-admin user may reach administrative benefits functionality and attempt to modify benefit information belonging to other users when role-based authorization is not enforced.
- **Existing Observation:** The `/benefits` GET and POST routes use `isLoggedIn`, while the available `isAdmin` middleware is only shown in commented fix code. The benefits handler accepts `userId` and `benefitStartDate` and passes them to the data-access layer.
- **Likelihood:** 3 (High)
- **Impact:** 3 (High)
- **Risk Score:** 9
- **Risk Level:** High
- **Proposed Control:** Enforce server-side role-based authorization using the admin middleware on both viewing and updating benefits functionality.
- **Control Location:** `app/routes/index.js` and `app/routes/benefits.js`

### T3 — Tampering with User Benefit Information

- **STRIDE Category:** Tampering
- **Affected Component:** Benefits request handler, BenefitsDAO, and MongoDB users collection
- **Threat Scenario:** An authenticated user who reaches the benefits update functionality may attempt to modify another user's benefit start date by supplying a target `userId` and a new `benefitStartDate`.
- **Existing Observation:** `benefits.js` obtains `userId` and `benefitStartDate` from `req.body`. `benefits-dao.js` uses the supplied `userId` to select a user document and writes the supplied date to `benefitStartDate`.
- **Likelihood:** 3 (High)
- **Impact:** 2 (Medium)
- **Risk Score:** 6
- **Risk Level:** High
- **Proposed Control:** Enforce server-side authorization before updates and validate permitted fields and values before writing changes to MongoDB.
- **Control Location:** `app/routes/index.js`, `app/routes/benefits.js`, and `app/data/benefits-dao.js`

### T4 — Information Disclosure of User Benefit Data

- **STRIDE Category:** Information Disclosure
- **Affected Component:** Benefits routes, benefits request handler, BenefitsDAO, and rendered benefits page
- **Threat Scenario:** An authenticated non-admin user may be able to view benefit information associated with other non-admin users when administrative benefits functionality is accessible without role-based authorization.
- **Existing Observation:** The `/benefits` GET route requires `isLoggedIn` but does not currently enforce the available `isAdmin` middleware. `benefits.js` calls `getAllNonAdminUsers()` and passes the returned `users` data to the `benefits` view for rendering.
- **Likelihood:** 3 (High)
- **Impact:** 2 (Medium)
- **Risk Score:** 6
- **Risk Level:** High
- **Proposed Control:** Enforce server-side admin authorization before returning benefit records and limit the data returned to only the fields required by the authorised function.
- **Control Location:** `app/routes/index.js`, `app/routes/benefits.js`, and `app/data/benefits-dao.js`

## 5. Threat-to-Control Mapping

| ID | STRIDE Category | Risk | Proposed Security Control | Control Location |
|---|---|---|---|---|
| T1 | Spoofing | 9 - High | Salted one-way password hashing and secure password verification | `app/data/user-dao.js` |
| T2 | Elevation of Privilege | 9 - High | Server-side role-based authorization using admin middleware | `app/routes/index.js`, `app/routes/benefits.js` |
| T3 | Tampering | 6 - High | Authorization checks and validation of permitted update fields and values | `app/routes/index.js`, `app/routes/benefits.js`, `app/data/benefits-dao.js` |
| T4 | Information Disclosure | 6 - High | Admin authorization and minimisation of user data returned to the view | `app/routes/index.js`, `app/routes/benefits.js`, `app/data/benefits-dao.js` |