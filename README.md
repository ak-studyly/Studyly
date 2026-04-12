# Studyly

A student study material and announcement platform built with Next.js 14 and Supabase.

## Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend / DB**: Supabase (Postgres + Auth + Storage)
- **Hosting**: Vercel (recommended)

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd studyly
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (keep this safe, server-only)

### 3. Set environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials in `.env.local`.

### 4. Run the database schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Paste and run the contents of `supabase/migrations/001_schema.sql`

### 5. Create storage buckets

In your Supabase dashboard → **Storage**:

1. Create bucket `materials` — set to **private**, max file size **20MB**
2. Create bucket `attachments` — set to **private**, max file size **10MB**

Then add storage policies (in SQL Editor):

```sql
-- Allow anyone to upload to materials bucket
create policy "Public upload materials"
  on storage.objects for insert
  with check (bucket_id = 'materials');

-- Allow anyone to read from materials bucket
create policy "Public read materials"
  on storage.objects for select
  using (bucket_id = 'materials');
```

### 6. Create your first CR account

CR accounts are created manually (no public sign-up for CRs):

1. Go to Supabase dashboard → **Authentication → Users → Invite user**
2. Enter the CR's email — they'll get a magic link
3. After they sign in, go to **Table Editor → profiles** and update their row:
   - Set `college_id` to your college's ID (from the `colleges` table)
   - Set `branch`, `year`, `section`
   - Set `role` to `cr`

> Alternatively, add a college via the homepage "add your college" form, approve it in the `colleges` table (set `approved = true`), then create the CR profile.

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    # Public homepage
│   ├── browse/[...slug]/page.tsx   # Public browse page
│   ├── upload/page.tsx             # Material upload
│   └── dashboard/
│       ├── layout.tsx              # Dashboard layout (CR/announcer only)
│       ├── page.tsx                # Unified dashboard feed
│       ├── manage-announcers/      # CR: manage announcers
│       ├── add-date/               # Add important date
│       └── settings/               # Profile settings
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx              # Shared navbar with profile dropdown
│   │   ├── AuthProvider.tsx        # Auth context
│   │   └── ThemeProvider.tsx       # Dark mode context
│   ├── public/
│   │   ├── HomepageClient.tsx      # Homepage search + materials preview
│   │   └── BrowseClient.tsx        # Browse page
│   ├── dashboard/
│   │   ├── DashboardFeed.tsx       # Main feed with composer
│   │   ├── DashboardSidebar.tsx    # Sidebar navigation
│   │   └── ManageAnnouncersClient.tsx
│   └── ui/
│       ├── SignInModal.tsx
│       └── AddCollegeModal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client
│   └── utils.ts                    # Helpers, styles, constants
└── types/index.ts                  # TypeScript types
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add environment variables (same as `.env.local`)
4. Deploy — Vercel auto-detects Next.js

---

## Key design decisions

- **No login for students** — anyone can browse materials and announcements via a public URL
- **CRs and announcers only sign in** — via the profile menu dropdown
- **Materials are reviewed before going live** — `approved = false` by default; you approve them in the Supabase dashboard (Table Editor → materials) or build an admin panel later
- **Dark mode** — stored in the user's profile (for logged-in users) or localStorage (for guests)
- **College addition** — submitted with `approved = false`; you approve in Supabase dashboard

---

## What's not built yet (future)

- Discussion / Q&A section
- College-wide and branch-wide announcements
- Admin panel for approving materials and colleges
- Real-time updates (Supabase Realtime is ready to drop in)
- Material upvoting with deduplication
