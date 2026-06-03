Vercel deployment and serverless function setup

1) Create a Vercel project
- Sign in at https://vercel.com with your GitHub account.
- Click "New Project" → import the repository `glitch-tech-jamin/kmb_business_management`.
- Set the root to the repository root (the `vercel.json` directs static files from `docs/`).

2) Add Environment Variables (Project Settings -> Environment Variables)
- `SUPABASE_URL` = https://<your-project>.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` = <your-service-role-key> (keep secret)
- `PURCHASE_API_KEY` = <random-secret-for-api-access>

3) How the serverless example works
- The serverless endpoint is at `/api/create-purchase-order`.
- It requires `x-api-key` header to match `PURCHASE_API_KEY`.
- The function uses `SUPABASE_SERVICE_ROLE_KEY` to write to `purchase_orders` and `inventory_movements` securely.

4) Example curl call (from a secure server or admin UI):

```bash
curl -X POST https://<your-vercel-app>.vercel.app/api/create-purchase-order \
  -H "Content-Type: application/json" \
  -H "x-api-key: <PURCHASE_API_KEY>" \
  -d '{"product_id":"<uuid>","quantity":10,"total_cost":150.00}'
```

5) Notes
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser. Use the serverless endpoint for privileged operations.
- You can call this API from your static app by proxying through a secure admin flow that attaches the `x-api-key` (do not store the key in client JS).
