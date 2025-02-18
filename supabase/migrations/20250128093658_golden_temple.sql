/*
  # Update channel-video relationship

  1. Changes
    - Remove the `recent_videos` JSONB column from channels table
    - Add a function to get recent videos for a channel
    - Add a materialized view for channels with their recent videos

  2. Performance
    - Optimized query for fetching recent videos
    - Indexed materialized view for faster access
*/

-- Remove the recent_videos JSONB column as we'll use the videos table relation
ALTER TABLE channels DROP COLUMN recent_videos;

-- Create a function to get recent videos for a channel
CREATE OR REPLACE FUNCTION get_channel_recent_videos(channel_uuid uuid, limit_count integer DEFAULT 3)
RETURNS TABLE (
  id uuid,
  title text,
  thumbnail_url text,
  view_count bigint,
  published_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.title,
    v.thumbnail_high as thumbnail_url,
    v.view_count,
    v.published_at
  FROM videos v
  WHERE v.channel_id = channel_uuid
  AND v.privacy_status = 'public'
  ORDER BY v.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a materialized view that includes channels with their recent videos
CREATE MATERIALIZED VIEW channels_with_recent_videos AS
SELECT 
  c.*,
  COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(v))
      FROM (
        SELECT 
          v.id,
          v.title,
          v.thumbnail_high as thumbnail_url,
          v.view_count,
          v.published_at
        FROM videos v
        WHERE v.channel_id = c.id
        AND v.privacy_status = 'public'
        ORDER BY v.published_at DESC
        LIMIT 3
      ) v
    ),
    '[]'::jsonb
  ) as recent_videos
FROM channels c;

-- Create indexes on the materialized view
CREATE UNIQUE INDEX ON channels_with_recent_videos (id);
CREATE INDEX channels_with_recent_videos_search_idx ON channels_with_recent_videos USING GIN (search_vector);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_channels_with_recent_videos()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY channels_with_recent_videos;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the materialized view
CREATE TRIGGER refresh_channels_view_on_video_change
  AFTER INSERT OR UPDATE OR DELETE
  ON videos
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_channels_with_recent_videos();

CREATE TRIGGER refresh_channels_view_on_channel_change
  AFTER INSERT OR UPDATE OR DELETE
  ON channels
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_channels_with_recent_videos();

-- Grant access to the materialized view
GRANT SELECT ON channels_with_recent_videos TO public;