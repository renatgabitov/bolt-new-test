/*
  # Create video search logs table
  
  1. New Tables
    - `video_search_logs`
      - `id` (uuid, primary key)
      - `search_query` (text)
      - `video_count` (integer)
      - `published_after` (timestamptz)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for:
      - Public inserts
      - Authenticated users can read all logs
*/

-- Drop the existing table if it exists
DROP TABLE IF EXISTS video_search_logs;

-- Create the table without user_id
CREATE TABLE video_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query text NOT NULL,
  video_count integer NOT NULL,
  published_after timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for timestamp queries
CREATE INDEX video_search_logs_created_at_idx ON video_search_logs(created_at);

-- Enable RLS
ALTER TABLE video_search_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public inserts"
  ON video_search_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read all logs"
  ON video_search_logs
  FOR SELECT
  TO authenticated
  USING (true);