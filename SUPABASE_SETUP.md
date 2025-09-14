# Supabase Setup Guide

This guide will help you set up Supabase as the database backend for your DeStore application.

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `destore`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose one close to your users
5. Click "Create new project"
6. Wait for the project to be ready (1-2 minutes)

## Step 2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **Project API Keys** → **anon** **public** (starts with `eyJhbGciOi...`)

## Step 3: Update Environment Variables

Update your `.env.local` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the following SQL to create the files table:

```sql
-- Create files table
create table files (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  file_name text not null,
  file_size bigint not null,
  file_type text not null,
  ipfs_hash text not null,
  upload_type text not null check (upload_type in ('traditional', 'web3')),
  token_id text,
  transaction_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index files_user_id_idx on files (user_id);
create index files_ipfs_hash_idx on files (ipfs_hash);
create index files_upload_type_idx on files (upload_type);
create index files_created_at_idx on files (created_at desc);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_files_updated_at
  before update on files
  for each row
  execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table files enable row level security;

-- Create RLS policies
create policy "Users can insert their own files" on files
  for insert with check (auth.uid()::text = user_id);

create policy "Users can view their own files" on files
  for select using (auth.uid()::text = user_id);

create policy "Users can update their own files" on files
  for update using (auth.uid()::text = user_id);

create policy "Users can delete their own files" on files
  for delete using (auth.uid()::text = user_id);
```

4. Click **Run** to execute the SQL

## Step 5: Configure Authentication (Optional)

Since you're using Clerk for authentication, you may want to sync user data:

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Under **External OAuth Providers**, you can configure additional providers if needed
3. For now, the RLS policies are set up to work with any authentication system using `user_id`

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Upload a file using either upload method
3. Check your Supabase dashboard → **Table Editor** → **files** to see the records

## Features Enabled

- ✅ **File Metadata Storage** - Store file information and IPFS hashes
- ✅ **User-based Access Control** - Each user can only access their own files
- ✅ **Upload Tracking** - Track both traditional IPFS and Web3 NFT uploads
- ✅ **Storage Statistics** - Get insights into storage usage
- ✅ **Real-time Updates** - Supabase provides real-time subscriptions
- ✅ **Automatic Timestamps** - Track when files were uploaded and updated

## Database Schema

The `files` table includes:
- `id` - Unique identifier
- `user_id` - Clerk user ID
- `file_name` - Original filename
- `file_size` - File size in bytes
- `file_type` - MIME type
- `ipfs_hash` - IPFS hash for file access
- `upload_type` - 'traditional' or 'web3'
- `token_id` - NFT token ID (for web3 uploads)
- `transaction_hash` - Blockchain transaction hash
- `created_at` / `updated_at` - Timestamps

## Benefits of Supabase Integration

1. **Persistent Storage** - File metadata persists across sessions
2. **Fast Queries** - Indexed database for quick file lookups
3. **User Management** - Seamless integration with Clerk auth
4. **Analytics** - Track upload patterns and storage usage
5. **Real-time** - Live updates when files are added/removed
6. **Scalable** - Handles millions of files efficiently

## Security

- **Row Level Security (RLS)** enabled
- **User isolation** - Users can only access their own data
- **API key protection** - Anon key is safe for client-side use
- **PostgreSQL** - Enterprise-grade database security

## Next Steps

After setup, the application will automatically:
- Save file records when uploads complete
- Display user's files in the Files section
- Provide storage statistics in the dashboard
- Enable file management features

---

This integration provides a robust backend for your decentralized storage application while maintaining the security and user experience standards expected in modern web applications.