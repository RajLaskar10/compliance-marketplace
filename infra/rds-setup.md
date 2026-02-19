# RDS Setup Guide

## Step 1: Create RDS Instance

1. Go to AWS Console → RDS → Create Database
2. Engine: PostgreSQL 15
3. Template: Free tier (for dev) or Production
4. Instance: `db.t3.micro` (free tier eligible)
5. Storage: 20 GB gp2
6. **Crucially: set "Publicly accessible" to NO** — only your EC2 should reach it

## Step 2: VPC & Security Group

1. Place RDS in the same VPC as your EC2
2. Create a security group for RDS: `compliance-rds-sg`
3. Inbound rule: PostgreSQL (5432) — source: EC2 security group (not 0.0.0.0/0)
4. This means only your EC2 can connect to RDS — no public internet access

## Step 3: Connect from EC2

```bash
# SSH into EC2 first, then:
psql -h your-rds-endpoint.rds.amazonaws.com -U your_username -d postgres

# Create database
CREATE DATABASE compliance_marketplace;
```

## Step 4: Run Schema

```bash
# From EC2, inside the project directory:
psql $DATABASE_URL -f server/models/schema.sql
```

## Step 5: Update .env

```
DATABASE_URL=postgresql://username:password@your-rds-endpoint.rds.amazonaws.com:5432/compliance_marketplace
```

## Cost Note

`db.t3.micro` is free tier eligible for 12 months (750 hours/month). After that, ~$15/month. Stop the instance when not in use if you're past free tier.
