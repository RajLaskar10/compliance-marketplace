# Architecture & Design Decisions

## Why AWS EC2 + RDS over a PaaS?

PaaS options (Heroku, Railway, Render) abstract away infrastructure. For a resume project targeting SWE roles, being able to explain EC2 instance sizing, RDS subnet groups, and security group configuration is more valuable than deployment convenience.

## Why PostgreSQL over MongoDB?

The compliance domain has highly relational data — a transaction references a buyer, a seller, a product, and may have flags, each of which reference admin users. A document DB would require denormalization that makes audit queries harder. PostgreSQL also supports JSONB for the `metadata` column in audit_logs, giving flexibility without sacrificing relational integrity.

## Why no ORM?

Raw `pg` queries force explicit SQL, which is directly relevant to both SWE and Analyst interviews. ORMs hide the query — interviewers often ask "how would you optimize this query?" and you need to know what query is actually running.

## KYC Flow

```
User submits form
      |
Document uploaded to S3 (pre-signed URL from backend)
      |
KYC record created with status: pending
      |
Rule engine runs synchronously:
  - full_name present and >= 2 words?
  - date_of_birth indicates age >= 18?
  - document_s3_key present?
      |
All pass → status: approved, user.kyc_status: approved
Any fail → status: rejected, rejection_reason populated
```

In a production system this would be async with a queue. For MVP, synchronous is fine and easier to explain.

## Transaction Flagging Flow

```
Buyer initiates purchase
      |
requireKYC middleware checks user.kyc_status === 'approved'
      |
Flag rules engine evaluates transaction (see /config/flagRules.js):
  1. HIGH_VALUE: amount > $10,000
  2. VELOCITY: buyer has > 5 transactions in last 10 minutes
  3. SAME_IP: buyer and seller IP match on this transaction
  4. NEW_ACCOUNT: buyer account created < 1 hour ago
      |
No flags → transaction.status: completed
Any flags → transaction.status: flagged, transaction_flags rows created
      |
Flagged → admin review queue
Admin approves → transaction.status: completed
Admin rejects → transaction.status: cancelled
```

## Audit Log Design

Every controller action ends with an `auditLog.record(...)` call. This is implemented as Express middleware that runs post-response to avoid blocking. The audit log table has no UPDATE or DELETE routes — this is intentional and should be called out in interviews as a conscious compliance design decision.

## AWS Infrastructure

```
Internet
   |
CloudFront (CDN)
   |
S3 (React static build)          EC2 (Express API, t3.micro)
                                        |
                              RDS PostgreSQL (db.t3.micro)
                              (private subnet, no public access)
                                        |
                              S3 Bucket (KYC documents, private)
```

Security notes:
- RDS is in a private subnet — only accessible from EC2 security group
- KYC S3 bucket is private — backend generates pre-signed URLs for upload/download
- EC2 only exposes port 443 (HTTPS via nginx reverse proxy) and 22 (SSH, restricted to your IP)
