# Compliance Flag Rules

## Overview

The transaction flagging engine evaluates every transaction against a configurable set of rules before completion. Flagged transactions are not auto-rejected — they enter an admin review queue. This mirrors real-world compliance workflows where false positives are common and human review is required.

## Current Rules

### HIGH_VALUE
- **Condition:** Transaction amount > $10,000
- **Rationale:** Large transactions are common triggers for regulatory review (e.g. Bank Secrecy Act reporting thresholds)
- **Configurable:** Yes — `FLAG_RULES.HIGH_VALUE.threshold` in `flagRules.js`

### VELOCITY
- **Condition:** Buyer has completed more than 5 transactions in the last 10 minutes
- **Rationale:** Rapid transaction velocity is a common signal for account takeover or card testing fraud
- **Configurable:** Yes — count and time window both configurable

### SAME_IP
- **Condition:** Buyer and seller share the same IP address on this transaction
- **Rationale:** May indicate self-dealing or a coordinated fraud attempt (seller buying their own listings to inflate metrics)
- **Configurable:** Yes — can be disabled for testing environments

### NEW_ACCOUNT
- **Condition:** Buyer account was created less than 1 hour ago
- **Rationale:** Fraud accounts are often used immediately after creation before detection
- **Configurable:** Yes — time window configurable

## Adding New Rules

1. Add rule logic to `/server/config/flagRules.js`
2. Add rule name to the `FLAG_RULES` enum
3. No other changes needed — the engine iterates all rules automatically

## Why Flags Don't Auto-Reject

Auto-rejection has high false positive rates. A legitimate user making a large first purchase would be blocked with no recourse. Flagging + human review is slower but fairer, and is standard practice in compliance-heavy industries (fintech, insurance, healthcare).
