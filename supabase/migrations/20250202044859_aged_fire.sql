/*
  # Create video search logs table

  1. New Tables
    - `video_search_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `search_query` (text)
      - `video_count` (integer)
      - `published_after` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `video_search_logs` table
    - Add policy for authenticated users to insert their own logs
    - Add policy for authenticated users to read their own logs
*/

CREATE TABLE IF NOT EXISTS video_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  search_query text NOT NULL,
  video_count integer NOT NULL,
  published_after timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX video_search_logs_user_id_idx ON video_search_logs(user_id);
CREATE INDEX video_search_logs_created_at_idx ON video_search_logs(created_at);

-- Enable RLS
ALTER TABLE video_search_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own logs"
  ON video_search_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own logs"
  ON video_search_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);