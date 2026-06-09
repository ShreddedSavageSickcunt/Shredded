# 🔥 Shredded

A group weight-loss accountability app for small friend groups (3–6 people).
Cheer each other on, log weekly check-ins, react to wins, and chase your goals
**together**. Built to feel social and energetic — not like a clinical fitness tracker.

Built with **Next.js (App Router)**, **Supabase** (Postgres + Storage), and **Tailwind CSS**.
Designed mobile-first, since everyone's checking in from their phone.

---

## Pages

| Route          | What it does                                                              |
| -------------- | ------------------------------------------------------------------------ |
| `/`            | Group dashboard — team name, every member, their progress & latest vibe  |
| `/checkin`     | Log weight, calories, a 1–5 vibe, notes, and an optional progress photo   |
| `/goals`       | Set/edit your starting + target weight, calorie target, and principles   |
| `/admin`       | Admins set the challenge name, team name, dates, frequency & add members  |
| `/member/[id]` | A member's full check-in history with emoji reactions                     |

There's **no password auth** yet: a member types their **name + access code**
once (set by an admin) and we remember them in `localStorage`. All data is
visible to everyone in the group — fully transparent by design.

---

## 1. Run it locally

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase values (step 2)
npm run dev
```

Open http://localhost:3000. Until Supabase is connected you'll see a friendly
"connect Supabase" banner instead of a crash.

---

## 2. Set up Supabase (manual dashboard steps)

1. Go to **https://supabase.com** → sign in → **New project**. Pick a name
   (e.g. `shredded`), set a database password, choose a region near your group.
2. Wait ~2 min for it to provision.
3. **SQL Editor** → **New query** → paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates all five
   tables, the open RLS policies, and the `checkin-photos` storage bucket.
4. *(Optional but recommended)* Run [`supabase/seed.sql`](supabase/seed.sql) the
   same way to create the challenge and a first admin (name **Alex**, code
   **squad42**). Edit it first to use your own names/codes.
5. **Project Settings → API**. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Paste both into your `.env.local`, then restart `npm run dev`.

> The `anon` key is meant to be public (it ships to the browser). Security comes
> from RLS policies. The schema intentionally leaves them wide open for this
> trusted-friends proof of concept — tighten them if you add real auth later.

You can now open `/admin`, sign in as your seeded admin, and add the rest of the crew.

---

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial Shredded scaffold"
```

Then create the repo and push (either works):

- **GitHub website:** create a new empty repo named `shredded` (no README), then:
  ```bash
  git branch -M main
  git remote add origin https://github.com/<you>/shredded.git
  git push -u origin main
  ```
- **GitHub CLI:** `gh repo create shredded --private --source=. --push`

---

## 4. Deploy to Vercel (manual dashboard steps)

1. Go to **https://vercel.com** → sign in with GitHub → **Add New… → Project**.
2. **Import** your `shredded` repo. Vercel auto-detects Next.js — leave the build
   settings as-is.
3. Expand **Environment Variables** and add the same two values from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - *(optional)* `NEXT_PUBLIC_SUPABASE_PHOTO_BUCKET` = `checkin-photos`
4. Click **Deploy**. In ~1 minute you'll get a live URL to share with the squad.

Every future `git push` to `main` auto-deploys.

---

## Project structure

```
src/
  app/
    layout.js            # shell + nav
    page.js              # / dashboard
    checkin/page.js      # /checkin
    goals/page.js        # /goals
    admin/page.js        # /admin
    member/[id]/page.js  # /member/[id]
  components/            # Nav, IdentityGate, ConfigNotice, useIdentity hook
  lib/                   # supabaseClient, session (localStorage), formatting
supabase/
  schema.sql             # run this in Supabase
  seed.sql               # optional starter data
```
