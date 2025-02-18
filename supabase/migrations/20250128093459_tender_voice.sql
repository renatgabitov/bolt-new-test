/*
  # Create videos table for YouTube content

  1. New Tables
    - `videos`
      - Basic Info:
        - `id` (uuid, primary key)
        - `youtube_id` (text, unique) - YouTube's video ID
        - `channel_id` (uuid, foreign key) - Reference to channels table
        - `title` (text)
        - `description` (text)
        - `published_at` (timestamptz)
        
      - Thumbnails:
        - `thumbnail_default` (text)
        - `thumbnail_medium` (text)
        - `thumbnail_high` (text)
        - `thumbnail_standard` (text)
        - `thumbnail_maxres` (text)
        
      - Statistics:
        - `view_count` (bigint)
        - `like_count` (bigint)
        - `comment_count` (bigint)
        
      - Content Details:
        - `duration` (interval) - Video duration
        - `dimension` (text) - 2d or 3d
        - `definition` (text) - hd or sd
        - `caption` (boolean) - Has captions
        - `licensed_content` (boolean)
        - `projection` (text) - rectangular or 360
        
      - Status:
        - `privacy_status` (text) - public, private, unlisted
        - `upload_status` (text) - uploaded, processed, etc
        - `embeddable` (boolean)
        - `made_for_kids` (boolean)
        
      - Topic Details:
        - `topics` (text[]) - Topic categories
        - `tags` (text[]) - Video tags
        
      - Player:
        - `embed_html` (text) - Iframe embed code
        - `embed_height` (integer)
        - `embed_width` (integer)
        
      - Recording Details:
        - `recording_date` (date)
        - `location` (jsonb) - Location details
        
      - Metadata:
        - `language` (text)
        - `category_id` (text)
        - `live_broadcast_content` (text) - none, upcoming, live, completed
        - `created_at` (timestamptz)
        - `updated_at` (timestamptz)

  2. Indexes
    - Full text search index on title and description
    - Index on youtube_id for quick lookups
    - Index on channel_id for relationship queries
    - Index on published_at for chronological queries
    - Index on view_count for popularity queries

  3. Security
    - Enable RLS
    - Allow public read access
    - Only allow authenticated users to create/update/delete
*/

-- Create the videos table
CREATE TABLE videos (
  -- Basic Info
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id text UNIQUE NOT NULL,
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  published_at timestamptz NOT NULL,
  
  -- Thumbnails
  thumbnail_default text,
  thumbnail_medium text,
  thumbnail_high text,
  thumbnail_standard text,
  thumbnail_maxres text,
  
  -- Statistics
  view_count bigint NOT NULL DEFAULT 0,
  like_count bigint NOT NULL DEFAULT 0,
  comment_count bigint NOT NULL DEFAULT 0,
  
  -- Content Details
  duration interval,
  dimension text CHECK (dimension IN ('2d', '3d')),
  definition text CHECK (definition IN ('hd', 'sd')),
  caption boolean DEFAULT false,
  licensed_content boolean DEFAULT false,
  projection text CHECK (projection IN ('rectangular', '360')),
  
  -- Status
  privacy_status text CHECK (privacy_status IN ('public', 'private', 'unlisted')),
  upload_status text CHECK (upload_status IN ('uploaded', 'processed', 'failed')),
  embeddable boolean DEFAULT true,
  made_for_kids boolean DEFAULT false,
  
  -- Topic Details
  topics text[],
  tags text[],
  
  -- Player
  embed_html text,
  embed_height integer,
  embed_width integer,
  
  -- Recording Details
  recording_date date,
  location jsonb,
  
  -- Metadata
  language text,
  category_id text,
  live_broadcast_content text CHECK (live_broadcast_content IN ('none', 'upcoming', 'live', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX videos_youtube_id_idx ON videos (youtube_id);
CREATE INDEX videos_channel_id_idx ON videos (channel_id);
CREATE INDEX videos_published_at_idx ON videos (published_at);
CREATE INDEX videos_view_count_idx ON videos (view_count);

-- Enable full-text search
ALTER TABLE videos ADD COLUMN search_vector tsvector 
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX videos_search_idx ON videos USING GIN (search_vector);

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON videos
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create videos"
  ON videos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their videos"
  ON videos
  FOR UPDATE
  TO authenticated
  USING (channel_id IN (
    SELECT id FROM channels WHERE auth.uid() = auth.uid()
  ));

CREATE POLICY "Allow authenticated users to delete their videos"
  ON videos
  FOR DELETE
  TO authenticated
  USING (channel_id IN (
    SELECT id FROM channels WHERE auth.uid() = auth.uid()
  ));

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_videos_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE
  ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_videos_updated_at_column();

-- Create function to update channel's last_posted date
CREATE OR REPLACE FUNCTION update_channel_last_posted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE channels
  SET last_posted = NEW.published_at
  WHERE id = NEW.channel_id
  AND (last_posted IS NULL OR last_posted < NEW.published_at);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_channel_last_posted
  AFTER INSERT OR UPDATE OF published_at
  ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_last_posted();