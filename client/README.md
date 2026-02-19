# Client — React Frontend

Built with Vite + React + TailwindCSS.

## Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx          # Email/password login
│   │   ├── RegisterForm.jsx       # Registration with role selection
│   │   └── ProtectedRoute.jsx     # Redirects unauthenticated users
│   ├── kyc/
│   │   ├── KYCForm.jsx            # KYC submission (name, DOB, document upload)
│   │   └── KYCStatusBanner.jsx    # Shows pending/rejected/approved status
│   ├── products/
│   │   ├── ProductList.jsx        # Browse all active listings
│   │   ├── ProductCard.jsx        # Single product tile
│   │   ├── ProductDetail.jsx      # Full product page + buy button
│   │   └── CreateProduct.jsx      # Seller: create new listing
│   ├── transactions/
│   │   ├── Checkout.jsx           # Initiate purchase
│   │   └── TransactionHistory.jsx # Buyer/seller transaction list
│   └── admin/
│       ├── FlagQueue.jsx          # Flagged transaction review
│       ├── KYCQueue.jsx           # KYC review (approve/reject)
│       └── AuditLogViewer.jsx     # Filterable audit log table
├── pages/
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx              # Role-aware landing after login
│   ├── KYCPage.jsx
│   ├── Products.jsx
│   ├── AdminPage.jsx
│   └── NotFound.jsx
├── context/
│   ├── AuthContext.jsx            # JWT storage, user state, login/logout
│   └── KYCContext.jsx             # KYC status, refetch after submission
└── utils/
    ├── api.js                     # Axios instance with JWT interceptor
    └── formatters.js              # Currency, date formatting
```

## Key UX Flows

- Buyer tries to purchase without KYC → blocked with prompt to complete KYC
- Seller tries to list without KYC → blocked
- Admin logs in → sees flag queue and KYC queue on dashboard
- Flagged transaction → buyer sees "under review" status, not "failed"
