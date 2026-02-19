# CloudFront + S3 Static Hosting (React Frontend)

## Step 1: Build React App

```bash
cd client
npm run build
# Output in /dist
```

## Step 2: Create S3 Bucket for Frontend

1. AWS Console → S3 → Create Bucket
2. Name: `compliance-marketplace-frontend`
3. Region: same as EC2/RDS
4. **Block all public access: ON** — CloudFront will serve it, not direct S3
5. Upload `/dist` contents to bucket

## Step 3: Create CloudFront Distribution

1. AWS Console → CloudFront → Create Distribution
2. Origin: your S3 bucket
3. Origin Access: "Origin access control settings (recommended)"
4. Create new OAC — this lets CloudFront read your private S3 bucket
5. Default root object: `index.html`
6. Under "Error pages": add custom error response
   - HTTP error: 403 → Response page: `/index.html` → HTTP 200
   - HTTP error: 404 → Response page: `/index.html` → HTTP 200
   - (This handles React Router client-side routing)

## Step 4: Update S3 Bucket Policy

After creating the distribution, CloudFront will show you a bucket policy to copy — paste it into your S3 bucket policy. This grants CloudFront read access.

## Step 5: Update React API Base URL

In your React app, set the API base URL to your EC2 endpoint:
```
VITE_API_BASE_URL=http://your-ec2-ip/api
```

Rebuild and re-upload to S3 after changing this.

## Deployment Script (future)

```bash
#!/bin/bash
cd client
npm run build
aws s3 sync dist/ s3://compliance-marketplace-frontend --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
echo "Frontend deployed and cache invalidated"
```
