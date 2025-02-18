/*
  # Add video lists tables

  1. New Tables
    - `video_lists`
      - `id` (uuid, primary key)
      - `name` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `video_list_items`
      - `id` (uuid, primary key)
      - `list_id` (uuid, references video_lists)
      - `video_id` (text)
      - `title` (text)
      - `description` (text)
      - `channel_id` (text)
      - `channel_title` (text)
      - `published_at` (timestamptz)
      - `thumbnail_url` (text)
      - `added_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their lists
*/

-- Create video_lists table
CREATE TABLE video_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create video_list_items table
CREATE TABLE video_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES video_lists(id) ON DELETE CASCADE NOT NULL,
  video_id text NOT NULL,
  title text NOT NULL,
  description text,
  channel_id text NOT NULL,
  channel_title text NOT NULL,
  published_at timestamptz NOT NULL,
  thumbnail_url text,
  added_at timestamptz DEFAULT now(),
  UNIQUE(list_id, video_id)
);

-- Create indexes
CREATE INDEX video_lists_user_id_idx ON video_lists(user_id);
CREATE INDEX video_list_items_list_id_idx ON video_list_items(list_id);

-- Enable RLS
ALTER TABLE video_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_list_items ENABLE ROW LEVEL SECURITY;

-- Create policies for video_lists
CREATE POLICY "Users can create their own lists"
  ON video_lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own lists"
  ON video_lists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON video_lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON video_lists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for video_list_items
CREATE POLICY "Users can add items to their lists"
  ON video_list_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_lists
      WHERE id = list_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view items in their lists"
  ON video_list_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_lists
      WHERE id = list_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their lists"
  ON video_list_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_lists
      WHERE id = list_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_lists
      WHERE id = list_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their lists"
  ON video_list_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_lists
      WHERE id = list_id
      AND user_id = auth.uid()
    )
  );

-- Create function to update updated_at on video_lists
CREATE OR REPLACE FUNCTION update_video_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_lists_updated_at
  BEFORE UPDATE
  ON video_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_video_lists_updated_at();

-- Create function to update parent list's updated_at when items change
CREATE OR REPLACE FUNCTION update_parent_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE video_lists
  SET updated_at = now()
  WHERE id = NEW.list_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parent_list_updated_at
  AFTER INSERT OR UPDATE
  ON video_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_list_updated_at();