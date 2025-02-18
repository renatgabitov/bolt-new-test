/*
  # Create channels table for YouTube creator search

  1. New Tables
    - `channels`
      - `id` (uuid, primary key)
      - `title` (text, searchable)
      - `description` (text)
      - `email` (text)
      - `subscriber_count` (integer)
      - `video_count` (integer)
      - `view_count` (bigint)
      - `country` (text)
      - `language` (text)
      - `topics` (text[])
      - `published_at` (timestamptz)
      - `last_posted` (timestamptz)
      - `channel_type` (text)
      - `thumbnail_url` (text)
      - `social_links` (jsonb)
      - `recent_videos` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Full text search index on title and description
    - Index on subscriber_count for range queries
    - Index on language for filtering
    - Index on channel_type for filtering
    - Index on last_posted for date range queries

  3. Security
    - Enable RLS
    - Allow public read access
    - Only allow authenticated users to create/update/delete
*/

-- Create the channels table
CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  email text,
  subscriber_count integer NOT NULL DEFAULT 0,
  video_count integer NOT NULL DEFAULT 0,
  view_count bigint NOT NULL DEFAULT 0,
  country text,
  language text,
  topics text[],
  published_at timestamptz,
  last_posted timestamptz,
  channel_type text CHECK (channel_type IN ('business', 'personal')),
  thumbnail_url text,
  social_links jsonb DEFAULT '{}'::jsonb,
  recent_videos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX channels_subscriber_count_idx ON channels (subscriber_count);
CREATE INDEX channels_language_idx ON channels (language);
CREATE INDEX channels_channel_type_idx ON channels (channel_type);
CREATE INDEX channels_last_posted_idx ON channels (last_posted);

-- Enable full-text search
ALTER TABLE channels ADD COLUMN search_vector tsvector 
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX channels_search_idx ON channels USING GIN (search_vector);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON channels
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create channels"
  ON channels
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their channels"
  ON channels
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete their channels"
  ON channels
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE
  ON channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();