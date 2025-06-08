/*
  # Blog System Schema

  Create tables for a complete blog system:
  - blog_posts: Main table for blog posts
  - blog_categories: Categories for organizing posts
  - blog_tags: Tags for posts
  - blog_post_tags: Many-to-many relationship between posts and tags
  - blog_comments: Comments on blog posts (optional)
*/

-- Blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Blog tags table
CREATE TABLE IF NOT EXISTS blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  featured_image_url text,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES blog_categories(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured boolean NOT NULL DEFAULT false,
  read_time integer DEFAULT 0, -- in minutes
  views_count integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Blog post tags junction table
CREATE TABLE IF NOT EXISTS blog_post_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, tag_id)
);

-- Blog comments table (optional)
CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
CREATE POLICY "Categories are viewable by everyone"
  ON blog_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create categories"
  ON blog_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authors and admins can update categories"
  ON blog_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'coach')
    )
  );

-- RLS Policies for blog_tags
CREATE POLICY "Tags are viewable by everyone"
  ON blog_tags
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON blog_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for blog_posts
CREATE POLICY "Published posts are viewable by everyone"
  ON blog_posts
  FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Authors can view their own posts"
  ON blog_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all posts"
  ON blog_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create posts"
  ON blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
  ON blog_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can update all posts"
  ON blog_posts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authors can delete their own posts"
  ON blog_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete all posts"
  ON blog_posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for blog_post_tags
CREATE POLICY "Post tags are viewable by everyone"
  ON blog_post_tags
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authors can manage their post tags"
  ON blog_post_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_tags.post_id
      AND blog_posts.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_tags.post_id
      AND blog_posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all post tags"
  ON blog_post_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for blog_comments
CREATE POLICY "Comments on published posts are viewable by everyone"
  ON blog_comments
  FOR SELECT
  TO public
  USING (
    status = 'approved' AND
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_comments.post_id
      AND blog_posts.status = 'published'
    )
  );

CREATE POLICY "Authors can view their own comments"
  ON blog_comments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Authenticated users can create comments"
  ON blog_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own comments"
  ON blog_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all comments"
  ON blog_comments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);

CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag ON blog_post_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_author ON blog_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);

-- Triggers for updated_at
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at
  BEFORE UPDATE ON blog_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate read time
CREATE OR REPLACE FUNCTION calculate_read_time(content text)
RETURNS integer AS $$
BEGIN
  -- Assuming average reading speed of 200 words per minute
  RETURN GREATEST(1, (array_length(string_to_array(content, ' '), 1) / 200.0)::integer);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate slug and read time
CREATE OR REPLACE FUNCTION blog_post_before_insert_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  
  -- Calculate read time
  NEW.read_time := calculate_read_time(NEW.content);
  
  -- Set published_at when status changes to published
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    NEW.published_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for blog posts
CREATE TRIGGER blog_post_before_insert_update_trigger
  BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION blog_post_before_insert_update();

-- Insert default categories
INSERT INTO blog_categories (name, slug, description) VALUES
  ('Education', 'education', 'Educational content about trading and investing'),
  ('Strategy', 'strategy', 'Trading strategies and techniques'),
  ('Psychology', 'psychology', 'Trading psychology and mindset'),
  ('Market Analysis', 'market-analysis', 'Market analysis and insights'),
  ('News', 'news', 'Latest news and updates'),
  ('Technology', 'technology', 'Trading technology and tools')
ON CONFLICT (slug) DO NOTHING;

-- Insert default tags
INSERT INTO blog_tags (name, slug) VALUES
  ('Technical Analysis', 'technical-analysis'),
  ('Fundamental Analysis', 'fundamental-analysis'),
  ('Risk Management', 'risk-management'),
  ('Beginner', 'beginner'),
  ('Intermediate', 'intermediate'),
  ('Advanced', 'advanced'),
  ('Day Trading', 'day-trading'),
  ('Swing Trading', 'swing-trading'),
  ('Options', 'options'),
  ('Forex', 'forex'),
  ('Cryptocurrency', 'cryptocurrency'),
  ('Stocks', 'stocks'),
  ('Psychology', 'psychology'),
  ('Strategy', 'strategy'),
  ('Charts', 'charts'),
  ('Indicators', 'indicators')
ON CONFLICT (slug) DO NOTHING;