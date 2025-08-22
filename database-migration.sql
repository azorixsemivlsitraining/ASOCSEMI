-- Comprehensive Database Schema Migration for Form Data Storage
-- This file creates all necessary tables for storing form submissions in the admin dashboard
-- Run this script in your Supabase SQL Editor or database management tool

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table for contact form submissions
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_applications table for job application form submissions
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  experience TEXT NOT NULL,
  resume_url TEXT,
  cover_letter TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create get_started_requests table for "Get Started" form submissions
CREATE TABLE IF NOT EXISTS get_started_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  job_title TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resume_uploads table for general resume submissions
CREATE TABLE IF NOT EXISTS resume_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  position_interested TEXT,
  experience_level TEXT,
  skills TEXT,
  cover_letter TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table for admin access management (optional)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_applications_email ON job_applications(email);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_position ON job_applications(position);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_get_started_requests_email ON get_started_requests(email);
CREATE INDEX IF NOT EXISTS idx_get_started_requests_created_at ON get_started_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resume_uploads_email ON resume_uploads(email);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_position ON resume_uploads(position_interested);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_created_at ON resume_uploads(created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE get_started_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Contacts table policies (anyone can insert, admins can view)
CREATE POLICY "Anyone can insert contacts" ON contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view contacts" ON contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%admin%'
    )
  );

-- Job applications table policies
CREATE POLICY "Anyone can insert job applications" ON job_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own applications" ON job_applications
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%admin%'
    )
  );

CREATE POLICY "Admins can update applications" ON job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%admin%'
    )
  );

-- Get started requests table policies
CREATE POLICY "Anyone can insert get started requests" ON get_started_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view get started requests" ON get_started_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%admin%'
    )
  );

-- Resume uploads table policies
CREATE POLICY "Anyone can insert resume uploads" ON resume_uploads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view resume uploads" ON resume_uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%admin%'
    )
  );

-- Admin users table policies
CREATE POLICY "Admins can manage admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.role = 'super_admin'
    )
  );

-- Set up storage bucket for resumes if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for resumes bucket
CREATE POLICY "Anyone can upload resumes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Admins can view resumes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes' AND (
      EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email LIKE '%admin%'
      )
    )
  );

CREATE POLICY "Admins can delete resumes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resumes' AND (
      EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email LIKE '%admin%'
      )
    )
  );

-- Create functions for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_get_started_requests_updated_at BEFORE UPDATE ON get_started_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_uploads_updated_at BEFORE UPDATE ON resume_uploads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin user (replace with your actual admin email)
-- Uncomment and modify the following line with your admin email:
-- INSERT INTO admin_users (user_id, email, role) 
-- SELECT id, email, 'super_admin' 
-- FROM auth.users 
-- WHERE email = 'your-admin-email@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- Create views for easier data access (optional)
CREATE OR REPLACE VIEW admin_dashboard_summary AS
SELECT 
  'contacts' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as this_month
FROM contacts
UNION ALL
SELECT 
  'job_applications' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as this_month
FROM job_applications
UNION ALL
SELECT 
  'get_started_requests' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as this_month
FROM get_started_requests
UNION ALL
SELECT 
  'resume_uploads' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as this_month
FROM resume_uploads;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database migration completed successfully! All tables and policies have been created.';
    RAISE NOTICE 'Remember to:';
    RAISE NOTICE '1. Configure your Supabase storage bucket for resumes';
    RAISE NOTICE '2. Update admin user email in the INSERT statement above';
    RAISE NOTICE '3. Test form submissions to ensure data is being stored correctly';
END $$;
