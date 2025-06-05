/*
  # Add testimonials table and foreign key

  1. New Tables
    - `testimonials`
      - `id` (uuid, primary key)
      - `text` (text)
      - `author_id` (uuid)
      - `author_name` (text)
      - `author_title` (text)
      - `rating` (integer)
      - `approved` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on testimonials table
    - Add policies for reading and creating testimonials
*/

-- Create testimonials table
CREATE TABLE testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_title text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  approved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Testimonials are readable by everyone"
  ON testimonials
  FOR SELECT
  TO public
  USING (approved = true);

CREATE POLICY "Users can create testimonials"
  ON testimonials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own testimonials"
  ON testimonials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- Indexes
CREATE INDEX testimonials_author_id_idx ON testimonials(author_id);
CREATE INDEX testimonials_approved_idx ON testimonials(approved);
CREATE INDEX testimonials_created_at_idx ON testimonials(created_at);