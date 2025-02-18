import React from 'react';
import { Eye, ThumbsUp, MessageCircle } from 'lucide-react';

interface VideoDetails {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
      standard: { url: string; width: number; height: number };
      maxres: { url: string; width: number; height: number };
    };
    channelTitle: string;
    tags: string[];
    categoryId: string;
    liveBroadcastContent: string;
    defaultAudioLanguage: string;
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    contentRating: Record<string, unknown>;
    projection: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}

interface VideoDetailsProps {
  videoId: string;
  videoDetails: VideoDetails;
  isLoading?: boolean;
}

export const VideoDetails: React.FC<VideoDetailsProps> = ({ 
  videoId, 
  videoDetails, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="w-full aspect-video bg-gray-200 rounded" />
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="relative w-full pt-[56.25%]">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {videoDetails.snippet.title}
        </h2>
        
        <a 
          href={`https://youtube.com/channel/${videoDetails.snippet.channelId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-gray-900 hover:text-black"
        >
          {videoDetails.snippet.channelTitle}
        </a>

        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{parseInt(videoDetails.statistics.viewCount).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ThumbsUp className="w-4 h-4" />
            <span>{parseInt(videoDetails.statistics.likeCount).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{parseInt(videoDetails.statistics.commentCount).toLocaleString()}</span>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <div>Published: {new Date(videoDetails.snippet.publishedAt).toLocaleDateString()}</div>
        </div>

        {videoDetails.snippet.tags && videoDetails.snippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {videoDetails.snippet.tags.slice(0, 5).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};