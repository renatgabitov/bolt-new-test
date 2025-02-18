import React, { useState } from 'react';
import { AlertCircle, Loader2, Link as LinkIcon, Download } from 'lucide-react';
import { ChannelCard } from '../components/ChannelCard';
import { logger } from '../lib/logger';

interface YouTubeChannelResponse {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: Array<{
    kind: string;
    etag: string;
    id: string;
    snippet: {
      title: string;
      description: string;
      customUrl?: string;
      publishedAt: string;
      thumbnails: {
        default?: { url: string; width: number; height: number };
        medium?: { url: string; width: number; height: number };
        high?: { url: string; width: number; height: number };
      };
      country?: string;
    };
    statistics: {
      viewCount: string;
      subscriberCount: string;
      hiddenSubscriberCount: boolean;
      videoCount: string;
    };
  }>;
}

export const ThumbnailDownloaderPage: React.FC = () => {
  const [channelInput, setChannelInput] = useState('');
  const [maxVideos, setMaxVideos] = useState<number>(50);
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelDetails, setChannelDetails] = useState<YouTubeChannelResponse['items'][0] | null>(null);

  const extractChannelInfo = (input: string): { id: string | null; handle: string | null } => {
    if (!input || typeof input !== 'string') return { id: null, handle: null };

    try {
      // Clean the input
      const cleanInput = input.trim();

      // Check for channel ID format (UC...)
      if (cleanInput.startsWith('UC') && cleanInput.length === 24) {
        return { id: cleanInput, handle: null };
      }

      // Check for channel URL with ID
      const idMatch = cleanInput.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]{24})/);
      if (idMatch && idMatch[1]) {
        return { id: idMatch[1], handle: null };
      }

      // Check for handle format in URL
      const handleMatch = cleanInput.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|@)([a-zA-Z0-9_-]+)/);
      if (handleMatch && handleMatch[1]) {
        return { id: null, handle: `@${handleMatch[1]}` };
      }

      // Check if input is already a handle
      if (cleanInput.startsWith('@')) {
        return { id: null, handle: cleanInput };
      }

      // If input is just text, assume it's a handle without @
      if (/^[a-zA-Z0-9_-]+$/.test(cleanInput)) {
        return { id: null, handle: `@${cleanInput}` };
      }

      return { id: null, handle: null };
    } catch (err) {
      logger.error('Error extracting channel information:', err);
      return { id: null, handle: null };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim()) return;

    setError(null);
    setIsLoadingChannel(true);
    setChannelDetails(null);

    const { id: channelId, handle } = extractChannelInfo(channelInput);
    
    if (!channelId && !handle) {
      setError('Invalid channel URL or handle. Please enter a valid YouTube channel URL or handle.');
      setIsLoadingChannel(false);
      return;
    }

    try {
      // Fetch channel details from the new base URL
      const baseUrl = 'https://server.theyoutubetool.com/youtube/channel';
      const channelUrl = channelId 
        ? `${baseUrl}?channelID=${channelId}`
        : `${baseUrl}?handle=${encodeURIComponent(handle)}`;

      const response = await fetch(channelUrl);
      const data: YouTubeChannelResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch channel details');
      }

      // Check if we have valid channel data
      if (!data.items || data.items.length === 0) {
        throw new Error('Channel not found');
      }

      // Get the first channel from the items array
      const channelData = data.items[0];
      setChannelDetails(channelData);

      // Start download immediately using the channel ID
      handleDownload(channelData, handle);
    } catch (err) {
      logger.error('Error fetching channel:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch channel information');
    } finally {
      setIsLoadingChannel(false);
    }
  };

  const handleDownload = async (channel: YouTubeChannelResponse['items'][0], handle: string | null) => {
    if (!channel) return;

    setIsDownloading(true);
    setError(null);

    try {
      // Use either channel ID or handle for the download
      const channelIdentifier = handle || channel.id;
      
      const response = await fetch(
        `https://server.theyoutubetool.com/thumbnail-downloader?channel=${channelIdentifier}&max_videos=${maxVideos}`
      );

      if (!response.ok) {
        throw new Error('Failed to download thumbnails');
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${channel.snippet.title}-thumbnails.zip`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logger.info('Thumbnails downloaded successfully', {
        channelId: channel.id,
        handle,
        maxVideos,
        channelTitle: channel.snippet.title
      });
    } catch (err) {
      logger.error('Error downloading thumbnails:', err);
      setError(err instanceof Error ? err.message : 'Failed to download thumbnails');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          YouTube Channel Thumbnail Downloader
        </h1>
        <p className="text-gray-600">
          Download thumbnails from any YouTube channel by entering the channel URL or handle below.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="channel-input" className="block text-sm font-medium text-gray-700 mb-1">
              Channel URL or Handle
            </label>
            <div className="relative">
              <input
                id="channel-input"
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="Enter channel ID, URL, or handle (e.g., @example)"
                className="search-input pl-10"
              />
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Examples: UC..., @channelname, youtube.com/@channelname
            </p>
          </div>

          <div>
            <label htmlFor="max-videos" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Thumbnails
            </label>
            <select
              id="max-videos"
              value={maxVideos}
              onChange={(e) => setMaxVideos(Number(e.target.value))}
              className="select"
            >
              <option value={50}>50 thumbnails</option>
              <option value={100}>100 thumbnails</option>
              <option value={200}>200 thumbnails</option>
              <option value={500}>500 thumbnails</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoadingChannel || isDownloading || !channelInput.trim()}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {isLoadingChannel || isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isLoadingChannel ? 'Loading...' : 'Downloading Thumbnails...'}</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download {maxVideos} Thumbnails</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[6px]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 break-words">{error}</p>
          </div>
        </div>
      )}

      {channelDetails && (
        <div className="space-y-6">
          <ChannelCard channelDetails={channelDetails} />
        </div>
      )}
    </div>
  );
};