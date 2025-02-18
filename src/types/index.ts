export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  channelId?: string;
  thumbnail: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

export interface SocialMedia {
  email: string | null;
  linkedin: string | null;
  instagram: string | null;
  tiktok: string | null;
  website: string | null;
  twitter: string | null;
}

export interface RelevantVideo {
  video_id: string;
  title: string;
  channel_id: string;
  channel_title: string;
  view_count: number;
  published_at: string;
  description: string;
  thumbnail_url: string | null;
}

export interface CreatorSearchResult {
  channel_id: string;
  title: string;
  video_count: number;
  relevant_videos: RelevantVideo[];
  total_topic_views: number | null;
  subscriber_count: number | null;
  total_view_count: number | null;
  description: string;
  social_media: SocialMedia;
}

export interface CreatorSearchResponse {
  api_metrics: {
    youtube_search_calls: number;
    video_details_calls: number;
    channel_stats_calls: number;
    total_api_calls: number;
    execution_time: number;
  };
  keyword: string;
  search_timestamp: string;
  total_channels_found: number;
  channels: CreatorSearchResult[];
}

export interface SearchFilters {
  max_videos?: number;
  max_channels?: number;
  published_after?: string;
}

export interface SavedList {
  id: string;
  userId: string;
  name: string;
  channels: YouTubeChannel[];
  createdAt: string;
  updatedAt: string;
}

// Legacy interface kept for compatibility
export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  email: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  country: string;
  language: string;
  topics: string[];
  publishedAt: string;
  lastPosted: string;
  channelType: 'business' | 'personal';
  thumbnailUrl: string;
  recentVideos: YouTubeVideo[];
  socialLinks: {
    website?: string;
    twitter?: string;
    linkedin?: string;
  };
}