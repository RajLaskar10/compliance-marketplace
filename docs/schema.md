# Database Schema

## Tables

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR | bcrypt |
| role | ENUM(buyer, seller, admin) | |
| kyc_status | ENUM(not_submitted, pending, approved, rejected) | default: not_submitted |
| created_at | TIMESTAMP | |

### kyc_records
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| full_name | VARCHAR | |
| date_of_birth | DATE | |
| document_s3_key | VARCHAR | S3 object key |
| status | ENUM(pending, approved, rejected) | |
| reviewed_by | UUID FK → users (admin) | nullable |
| reviewed_at | TIMESTAMP | nullable |
| rejection_reason | TEXT | nullable |
| submitted_at | TIMESTAMP | |

### products
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| seller_id | UUID FK → users | |
| title | VARCHAR | |
| description | TEXT | |
| price | NUMERIC(10,2) | |
| stock | INTEGER | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMP | |

### transactions
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| buyer_id | UUID FK → users | |
| seller_id | UUID FK → users | |
| product_id | UUID FK → products | |
| amount | NUMERIC(10,2) | |
| status | ENUM(pending, completed, flagged, cancelled) | |
| created_at | TIMESTAMP | |

### transaction_flags
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| transaction_id | UUID FK → transactions | |
| flag_rule | VARCHAR | e.g. "HIGH_VALUE", "VELOCITY", "SAME_IP", "NEW_ACCOUNT" |
| flagged_at | TIMESTAMP | |
| reviewed_by | UUID FK → users (admin) | nullable |
| resolution | ENUM(approved, rejected) | nullable |
| resolved_at | TIMESTAMP | nullable |

### audit_logs
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | actor |
| action | VARCHAR | e.g. "USER_LOGIN", "KYC_SUBMITTED", "TRANSACTION_FLAGGED" |
| target_id | UUID | nullable — ID of affected resource |
| target_type | VARCHAR | e.g. "transaction", "kyc_record" |
| metadata | JSONB | additional context |
| ip_address | VARCHAR | |
| created_at | TIMESTAMP | |

## Key Design Decisions

- **No ORM** — raw `pg` queries for transparency and interview explainability
- **Audit logs are append-only** — no UPDATE or DELETE routes on this table by design
- **KYC status lives on users table** — denormalized for fast middleware checks without a join on every request
- **Flags don't auto-reject** — transactions move to `flagged` status and wait for admin review, mirroring real compliance workflows
