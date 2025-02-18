/*
  # Remove user ID requirement from video search logs

  1. Changes
    - Drop existing table and recreate without user_id requirement
    - Add basic logging fields
    - Enable RLS with public insert policy
    
  2. Security
    - Enable row level security
    - Allow public inserts
    - Allow authenticated users to read all logs
*/

-- Drop the existing table
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