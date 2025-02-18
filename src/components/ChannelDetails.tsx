import React from 'react';
import { Users, Video, Eye } from 'lucide-react';

interface ChannelDetails {
  kind: string;
  etag: string;
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    customUrl?: string;
    publishedAt?: string;
    thumbnails?: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
    };
    localized?: {
      title?: string;
      description?: string;
    };
    country?: string;
  };
  statistics?: {
    viewCount?: string;
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
    videoCount?: string;
  };
}

interface ChannelDetailsProps {
  channelDetails: ChannelDetails | null;
  isLoading?: boolean;
}

export const ChannelDetails: React.FC<ChannelDetailsProps> = ({ 
  channelDetails, 
  isLoading = false 
}) => {
  // Show loading state or handle null channelDetails
  if (isLoading || !channelDetails?.snippet) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  const { snippet, statistics } = channelDetails;
  
  // Safely access nested properties
  const thumbnailUrl = snippet?.thumbnails?.high?.url || 
                      snippet?.thumbnails?.medium?.url || 
                      snippet?.thumbnails?.default?.url;

  const subscriberCount = statistics?.subscriberCount;
  const videoCount = statistics?.videoCount;
  const viewCount = statistics?.viewCount;
  const hiddenSubscriberCount = statistics?.hiddenSubscriberCount;

  return (
    <div className="card overflow-hidden">
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-4">
          {thumbnailUrl && (
            <img 
              src={thumbnailUrl}
              alt={snippet.title || 'Channel thumbnail'}
              className="w-24 h-24 rounded-full object-cover"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {snippet.title}
            </h2>
            {snippet.customUrl && (
              <a 
                href={`https://youtube.com/channel/${channelDetails.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {snippet.customUrl}
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Subscribers</div>
              <div className="text-lg font-semibold text-gray-900">
                {!hiddenSubscriberCount && subscriberCount
                  ? parseInt(subscriberCount).toLocaleString()
                  : 'Hidden'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Video className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Videos</div>
              <div className="text-lg font-semibold text-gray-900">
                {videoCount ? parseInt(videoCount).toLocaleString() : '0'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Total Views</div>
              <div className="text-lg font-semibold text-gray-900">
                {viewCount ? parseInt(viewCount).toLocaleString() : '0'}
              </div>
            </div>
          </div>
        </div>

        {snippet.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {snippet.description}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          {snippet.publishedAt && (
            <div>Joined {new Date(snippet.publishedAt).toLocaleDateString()}</div>
          )}
          {snippet.country && (
            <div>Country: {snippet.country}</div>
          )}
        </div>
      </div>
    </div>
  );
};