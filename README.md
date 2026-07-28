# B3 Trading Platform

A deployment-ready B3 Trading website and customer dashboard built with static HTML, CSS and JavaScript, plus an optional Supabase database and Vercel serverless welcome email.

## Functional today

- Responsive navy/gold B3 Trading landing page
- Live TradingView ticker, searchable chart and automatically refreshed market news
- Registration with name, email, phone, password and account preference
- Separate customer dashboard
- $10,000 virtual demo balance
- Simulated buy/sell orders, stop loss and 1x–10x margin selection
- Demo portfolio and order history stored locally
- Payout preference form that stores only the final four digits
- Live-account request workflow with real transfers disabled
- Welcome-email function ready for Resend
- Supabase production schema with Row Level Security

## Security and compliance boundary

The demo module never places real market orders. Real deposits and automatic wallet transfers are intentionally disabled. Before enabling a live account, B3 Trading needs a regulated broker/custodian, KYC/AML verification, secure payment processing, transaction monitoring, legal review and all licenses required in the operating jurisdictions.

Never request or store a wallet seed phrase, private key, full card number or full bank credentials.

## Local use

Run any static server in the repository folder, for example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Put the public project URL and anon key in `config.js`.
4. Configure the site and redirect URLs in Supabase Authentication.

The website works in browser-local demo mode when Supabase is not configured.

## Enable the welcome email

Deploy to Vercel and add these environment variables:

- `RESEND_API_KEY`
- `WELCOME_FROM_EMAIL` — later set this to the verified B3 Trading sender
- `WELCOME_SIGNATURE_TITLE` — default: `Investment Education Specialist`

The email signs off:

> Best regards,  
> Carlos Espinal  
> Investment Education Specialist  
> B3 Trading

Use a regulated professional title only after verifying the underlying credential.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Add the email environment variables.
3. Deploy.
4. Connect `b3-trading.com` and follow Vercel's DNS instructions for GoDaddy.
