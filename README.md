# Empress Residence · Repair Requests

Simple web app for an 8-apartment building. Residents submit repair issues
with photos; management assigns deadlines, replies, and marks them done or
rejected. Built with React, Vite, and Supabase.

---

## Deployment in 8 steps (~40 minutes total)

You will need: a free Supabase account, a free Vercel account, a domain
(any registrar), and Node.js v18+ installed locally.

### 1. Create a Supabase project (5 min)

1. Go to https://supabase.com and sign up
2. Click **New project**
3. Name: `empress-residence`
4. Database password: any strong string (save it, you won't need it for this app)
5. Region: pick the one closest to Cyprus — **Frankfurt (eu-central-1)** is a good default
6. Wait ~2 minutes for provisioning

### 2. Run the SQL schema (2 min)

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `supabase-schema.sql` from this project, copy its contents into the editor
4. Click **Run**. Most of it succeeds immediately; storage policies will fail
   if the `photos` bucket doesn't exist yet — that's fine, you'll re-run after step 3.

### 3. Create the photos bucket (2 min)

1. Click **Storage** in the left sidebar
2. Click **New bucket**
3. Name: `photos`
4. Toggle **Public bucket** ON (so photo URLs work without authentication)
5. Click **Save**
6. Go back to **SQL Editor** and re-run `supabase-schema.sql` so the storage
   policies attach to the new bucket.

### 4. Copy your API keys (1 min)

1. Click **Settings** (gear icon, bottom left) → **API**
2. Copy **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy the **anon public** key (long string starting with `eyJ...`)
   — **not** the service_role key, which must stay secret

### 5. Run the app locally (5 min)

```bash
# Unzip this project, cd into the folder
cd empress-residence-repairs

# Install dependencies
npm install

# Create your env file
cp .env.example .env

# Open .env in any text editor and paste:
#   VITE_SUPABASE_URL=https://your-project-id.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJ...

# Start the dev server
npm run dev
```

Open http://localhost:5173 in your browser. You should see the login screen
with the SVG sunset. Sign in as Apt. 101, submit a test request with a
photo, sign out, sign in as management — it should appear.

If the app loads but new requests fail: re-check your `.env` values and
that the SQL ran without errors.

### 6. Push to GitHub (5 min)

You need a GitHub account. Skip if you already have a repo for this.

```bash
git init
git add .
git commit -m "Initial commit"

# Create a new repo on https://github.com/new (Private is fine)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/empress-residence-repairs.git
git branch -M main
git push -u origin main
```

`.env` is in `.gitignore`, so your keys stay local. You'll add them in
Vercel directly in step 7.

### 7. Deploy to Vercel (5 min)

1. Go to https://vercel.com and sign up with your GitHub account
2. Click **Add New… → Project**
3. Import your `empress-residence-repairs` repo
4. Framework Preset: **Vite** (auto-detected)
5. Expand **Environment Variables** and add two:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
6. Click **Deploy**
7. After ~1 minute, you get a live URL like `empress-residence-repairs.vercel.app`

Test it on your phone. Everything should work end-to-end.

### 8. Connect your custom domain (5 min)

Pick a domain from any registrar (Namecheap, Porkbun, and Cloudflare are
cheap and reliable — about $10–15 per year for a `.com`).

1. In Vercel: open your project → **Settings → Domains**
2. Type your domain (e.g. `empress-repairs.com`) → **Add**
3. Vercel shows DNS records you need to set
4. Log into your registrar, go to the DNS settings for your domain
5. Add the records Vercel shows (usually one A record `@ → 76.76.21.21`
   and one CNAME `www → cname.vercel-dns.com`)
6. Wait 5–30 minutes for DNS to propagate; Vercel auto-issues HTTPS

Your app is now live at `https://empress-repairs.com` (or whatever you chose).

---

## Share the link

Post this in your WhatsApp/Telegram building group:

> **Empress Residence — Repair requests**
> 🔗 https://empress-repairs.com
>
> Pick your apartment, describe the issue with a photo. Management replies
> with a deadline and status updates inside the app.

---

## Costs

| Service   | Free tier covers                                | Likely your usage     |
|-----------|------------------------------------------------|------------------------|
| Supabase  | 500 MB DB, 1 GB storage, 2 GB bandwidth/month  | Years of headroom      |
| Vercel    | 100 GB bandwidth/month                          | Won't come close       |
| Domain    | —                                              | $10–15/year            |

**Total: ~$15/year.**

---

## Updating the app

Make changes locally, commit and push to GitHub. Vercel automatically
rebuilds and redeploys within a minute.

```bash
git add .
git commit -m "Tweaked the wording on the login screen"
git push
```

---

## Security notes

The app has **no authentication**: anyone with the URL can sign in as any
apartment or as management. For a small building where everyone knows each
other, this is acceptable — the URL itself is the password. Don't share
the URL outside your residents group.

When you're ready to tighten security, options in order of complexity:

1. **Per-role PIN** — ask for a 4-digit code on the login screen. Simplest,
   adds basic friction.
2. **Per-apartment magic links** — Supabase Auth has built-in email magic
   links. Better security, slightly more setup.
3. **Stricter RLS policies** — restrict updates to management role only,
   etc. Requires auth first.

---

## File layout

```
empress-residence-repairs/
├── package.json
├── vite.config.js
├── index.html
├── .env.example          ← copy to .env and fill in
├── .gitignore
├── supabase-schema.sql   ← run in Supabase SQL Editor
├── README.md             ← this file
└── src/
    ├── main.jsx          ← React entry
    ├── App.jsx           ← all UI in one file (~900 lines)
    ├── data.js           ← Supabase read/write/upload logic
    └── supabase.js       ← Supabase client init
```

To customize: change `APARTMENTS`, `BUILDING_NAME`, or `BUILDING_LOCATION`
at the top of `src/App.jsx`. Colors live in the `<style>` block at the
bottom of the same file.
