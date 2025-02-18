import React from 'react';
import { Users, Video, Eye, Calendar, Globe } from 'lucide-react';

interface ChannelCardProps {
  channelDetails: {
    snippet?: {
      title?: string;
      description?: string;
      customUrl?: string;
      publishedAt?: string;
      thumbnails?: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
      };
      country?: string;
    };
    statistics?: {
      viewCount?: string;
      subscriberCount?: string;
      hiddenSubscriberCount?: boolean;
      videoCount?: string;
    };
  };
}

export const ChannelCard: React.FC<ChannelCardProps> = ({ channelDetails }) => {
  const { snippet = {}, statistics = {} } = channelDetails;
  
  const thumbnailUrl = snippet?.thumbnails?.high?.url || 
                      snippet?.thumbnails?.medium?.url || 
                      snippet?.thumbnails?.default?.url;

  const subscriberCount = statistics?.subscriberCount ? parseInt(statistics.subscriberCount) : 0;
  const videoCount = statistics?.videoCount ? parseInt(statistics.videoCount) : 0;
  const viewCount = statistics?.viewCount ? parseInt(statistics.viewCount) : 0;
  const joinYear = snippet?.publishedAt ? new Date(snippet.publishedAt).getFullYear() : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-black/10 overflow-hidden">
      <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-500">
        <div className="absolute -bottom-12 left-6">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl}
              alt={snippet?.title || 'Channel thumbnail'}
              className="w-24 h-24 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-16 px-6 pb-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{snippet?.title || 'Unknown Channel'}</h2>
          {snippet?.customUrl && (
            <a 
              href={`https://youtube.com/${snippet.customUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {snippet.customUrl}
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Subscribers</div>
              <div className="text-lg font-semibold text-gray-900">
                {statistics?.hiddenSubscriberCount
                  ? 'Hidden'
                  : subscriberCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Videos</div>
              <div className="text-lg font-semibold text-gray-900">
                {videoCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Total Views</div>
              <div className="text-lg font-semibold text-gray-900">
                {viewCount.toLocaleString()}
              </div>
            </div>
          </div>

          {joinYear && (
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Joined</div>
                <div className="text-lg font-semibold text-gray-900">
                  {joinYear}
                </div>
              </div>
            </div>
          )}
        </div>

        {snippet?.description && (
          <div className="space-y-4">
            <p className="text-gray-600 whitespace-pre-wrap">{snippet.description}</p>
            
            {snippet.country && (
              <div className="flex items-center space-x-2 text-gray-500">
                <Globe className="w-4 h-4" />
                <span>{new Intl.DisplayNames(['en'], { type: 'region' }).of(snippet.country)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};