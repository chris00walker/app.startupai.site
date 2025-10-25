-- Storage Buckets Configuration
-- Creates the 4 required storage buckets with RLS policies

-- ============================================================================
-- 1. USER UPLOADS BUCKET
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;
-- User uploads RLS policies
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view own uploads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
-- ============================================================================
-- 2. GENERATED REPORTS BUCKET
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-reports',
  'generated-reports',
  false,
  104857600, -- 100MB limit
  ARRAY['application/pdf', 'application/json', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;
-- Generated reports RLS policies
CREATE POLICY "Users can view own reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'generated-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "System can create reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generated-reports'
);
CREATE POLICY "Users can delete own reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'generated-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
-- ============================================================================
-- 3. PROJECT ASSETS BUCKET
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-assets',
  'project-assets',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
-- Project assets RLS policies
CREATE POLICY "Users can manage project assets"
ON storage.objects FOR ALL
USING (
  bucket_id = 'project-assets' AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id::text = (storage.foldername(name))[2]
    AND projects.user_id = auth.uid()
  )
);
-- ============================================================================
-- 4. PUBLIC ASSETS BUCKET
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;
-- Public assets policies (anyone can view)
CREATE POLICY "Public assets are viewable by all"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-assets');
CREATE POLICY "Authenticated users can upload public assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public-assets' AND
  auth.role() = 'authenticated'
);
CREATE POLICY "Users can manage own public assets"
ON storage.objects FOR ALL
USING (
  bucket_id = 'public-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
