# Server — Express Backend

Node.js + Express + PostgreSQL (raw `pg`, no ORM).

## Structure

```
server/
├── routes/
│   ├── auth.js          # POST /api/auth/register, /api/auth/login
│   ├── kyc.js           # POST /api/kyc/submit, GET /api/kyc/status
│   ├── products.js      # CRUD /api/products
│   ├── transactions.js  # POST /api/transactions, GET /api/transactions
│   └── admin.js         # GET/POST /api/admin/flags, /api/admin/kyc, /api/admin/audit
├── controllers/
│   ├── authController.js
│   ├── kycController.js
│   ├── productController.js
│   ├── transactionController.js
│   └── adminController.js
├── middleware/
│   ├── jwtAuth.js       # Verifies JWT, attaches req.user
│   ├── requireKYC.js    # Checks req.user.kyc_status === 'approved'
│   ├── requireRole.js   # requireRole('admin'), requireRole('seller')
│   └── auditLogger.js   # Post-response middleware: logs action to audit_logs
├── models/
│   ├── schema.sql       # Full DB schema — run once on RDS
│   ├── userModel.js
│   ├── kycModel.js
│   ├── productModel.js
│   ├── transactionModel.js
│   └── auditModel.js
└── config/
    ├── db.js            # pg Pool setup
    ├── s3.js            # AWS S3 client setup
    └── flagRules.js     # Compliance rule definitions + engine
```

## Middleware Chain (example: POST /api/transactions)

```
jwtAuth → requireKYC → transactionController → auditLogger
```

- `jwtAuth`: validates token, rejects with 401 if invalid
- `requireKYC`: checks KYC status, rejects with 403 if not approved
- `transactionController`: runs flag engine, creates transaction record
- `auditLogger`: records action after response is sent (non-blocking)

## Flag Engine (config/flagRules.js)

Rules are defined as an array of objects:
```js
{
  name: 'HIGH_VALUE',
  check: (transaction, context) => transaction.amount > process.env.FLAG_HIGH_VALUE_THRESHOLD
}
```

The engine runs all rules and returns an array of triggered rule names. If any rules trigger, the transaction is saved with `status: 'flagged'` and flag records are inserted.
