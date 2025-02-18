import React, { useState } from 'react';
import { Search, AlertCircle, Download, BookmarkPlus, RefreshCw, Loader, FileText, XCircle, Grid, LayoutList, CheckCircle } from 'lucide-react';
import { YouTubeVideo } from '../types';
import { VideoSearchFilters } from '../components/VideoSearchFilters';
import { SaveToListPopup } from '../components/SaveToListPopup';
import { logger } from '../lib/logger';

interface TranscriptResponse {
  lang: string;
  availableLangs: string[];
  content: Array<{
    lang: string;
    text: string;
    offset: number;
    duration: number;
  }>;
}

interface TranscriptStatus {
  videoId: string;
  status: 'loading' | 'success' | 'error';
  message?: string;
  timestamp: string;
}

const VideoSearchPage: React.FC = () => {
  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const defaultPublishedAfter = sevenDaysAgo.toISOString();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; data?: any } | null>(null);
  const [videoCount, setVideoCount] = useState(25);
  const [publishedAfter, setPublishedAfter] = useState(defaultPublishedAfter);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [showSaveToListPopup, setShowSaveToListPopup] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [totalFetched, setTotalFetched] = useState(0);
  const [isGridView, setIsGridView] = useState(false);
  const [duration, setDuration] = useState<string>('any');
  const [transcriptStatus, setTranscriptStatus] = useState<TranscriptStatus | null>(null);

  const processVideoResults = (items: any[], pageIndex: number): YouTubeVideo[] => {
    const timestamp = Date.now();
    return items.map((item: any, index: number) => ({
      id: `${item.id.videoId}-${timestamp}-${pageIndex}-${index}`,
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnail: item.snippet.thumbnails.high?.url || 
                item.snippet.thumbnails.medium?.url || 
                item.snippet.thumbnails.default?.url
    }));
  };

  const fetchVideos = async (pageToken?: string) => {
    const requestCount = pageToken ? 50 : Math.min(videoCount, 50);
    const searchUrl = `/youtube?keyword=${encodeURIComponent(searchQuery)}&video_count=${requestCount}&published_after=${encodeURIComponent(publishedAfter)}&type=video${pageToken ? `&pageToken=${pageToken}` : ''}${duration !== 'any' ? `&duration=${duration}` : ''}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch videos');
      }

      if (!data || !data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format from server');
      }

      const pageIndex = pageToken ? results.length / 50 : 0;
      const videos = processVideoResults(data.items, pageIndex);

      return {
        videos,
        nextPageToken: data.nextPageToken || null,
      };
    } catch (err) {
      throw err;
    }
  };

  const handleSearch = async (e?: React.FormEvent, isRetry: boolean = false) => {
    if (e) {
      e.preventDefault();
    }
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    if (!isRetry) {
      setResults([]);
      setError(null);
      setSelectedVideos([]);
      setNextPageToken(null);
      setTotalFetched(0);
    }
    
    try {
      const { videos, nextPageToken: token } = await fetchVideos();
      setResults(videos);
      setNextPageToken(token);
      setTotalFetched(videos.length);
      setError(null);
      setRetryCount(0);

      if (videoCount > 50 && token) {
        await loadMoreVideos(token, videos);
      }
    } catch (err) {
      const isAbortError = err instanceof Error && err.name === 'AbortError';
      const isNetworkError = err instanceof Error && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('NetworkError') ||
        err.message.includes('Network request failed')
      );

      setError({
        message: isAbortError 
          ? 'Request timed out. Please try again.' 
          : isNetworkError 
            ? 'Network error. Please check your connection and try again.'
            : 'An unexpected error occurred',
        data: {
          error: err instanceof Error ? {
            name: err.name,
            message: err.message,
            stack: err.stack
          } : err,
          request: {
            query: searchQuery,
            videoCount,
            publishedAfter
          },
          timestamp: new Date().toISOString(),
          retryCount
        }
      });

      logger.error('Video search failed', {
        error: err,
        query: searchQuery,
        videoCount,
        publishedAfter,
        retryCount
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreVideos = async (token: string, currentVideos: YouTubeVideo[] = results) => {
    if (!token || isLoadingMore || totalFetched >= videoCount) return;

    setIsLoadingMore(true);
    try {
      const { videos, nextPageToken: newToken } = await fetchVideos(token);
      const updatedVideos = [...currentVideos, ...videos];
      setResults(updatedVideos);
      setNextPageToken(newToken);
      setTotalFetched(updatedVideos.length);

      if (updatedVideos.length < videoCount && newToken) {
        await loadMoreVideos(newToken, updatedVideos);
      }
    } catch (err) {
      logger.error('Error loading more videos', err);
      console.error('Error loading more videos:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    handleSearch(undefined, true);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVideos(results.map(video => video.videoId));
    } else {
      setSelectedVideos([]);
    }
  };

  const handleSelectVideo = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleSaveToList = (listId: string | null, listName: string) => {
    const selectedVideoObjects = results.filter(video => 
      selectedVideos.includes(video.videoId)
    );
    logger.info('Saving videos to list', { listId, listName, videoCount: selectedVideoObjects.length });
    setShowSaveToListPopup(false);
  };

  const handleExportCSV = () => {
    const selectedVideoObjects = results.filter(video => 
      selectedVideos.includes(video.videoId)
    );

    const csvContent = [
      ['Video Title', 'Channel', 'Channel URL', 'Published Date', 'Description', 'Video URL', 'Thumbnail URL'].join(','),
      ...selectedVideoObjects.map(video => [
        `"${video.title.replace(/"/g, '""')}"`,
        `"${video.channelTitle.replace(/"/g, '""')}"`,
        `"https://youtube.com/channel/${video.channelId}"`,
        new Date(video.publishedAt).toLocaleDateString(),
        `"${video.description.replace(/"/g, '""')}"`,
        `"https://youtube.com/watch?v=${video.videoId}"`,
        `"${video.thumbnail}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `youtube_videos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTranscript = async (videoId: string, title: string, channelTitle: string) => {
    setTranscriptStatus({
      videoId,
      status: 'loading',
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(
        `/youtube/transcript-3?videoID=${videoId}`
      );
      
      const data: TranscriptResponse = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to fetch transcript');
      }

      if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
        throw new Error('No transcript available');
      }

      const content = data.content
        .filter(item => item && item.text)
        .map(item => {
          const totalSeconds = Math.floor(item.offset / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          const time = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
          ].join(':');
          
          return `[${time}] ${item.text.trim()}`;
        })
        .join('\n\n');

      if (!content) {
        throw new Error('No transcript content available');
      }

      const cleanTitle = title.replace(/[^a-z0-9\s-]/gi, '').trim();
      const cleanChannel = channelTitle.replace(/[^a-z0-9\s-]/gi, '').trim();
      const fileName = `${cleanTitle}--${cleanChannel}--transcript.txt`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTranscriptStatus({
        videoId,
        status: 'success',
        timestamp: new Date().toISOString()
      });

      setTimeout(() => {
        setTranscriptStatus(prev => 
          prev?.videoId === videoId ? null : prev
        );
      }, 3000);

    } catch (err) {
      logger.error('Error downloading transcript', { error: err, videoId });
      console.error('Error downloading transcript:', err);
      setTranscriptStatus({
        videoId,
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to download transcript',
        timestamp: new Date().toISOString()
      });
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {results.map((video) => (
        <div key={video.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative">
            <div className="absolute top-3 left-3 z-10">
              <input
                type="checkbox"
                checked={selectedVideos.includes(video.videoId)}
                onChange={() => handleSelectVideo(video.videoId)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-full aspect-video object-cover"
            />
          </div>
          <div className="p-4">
            <a 
              href={`https://youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-900 hover:text-indigo-600 line-clamp-2 mb-2"
            >
              {video.title}
            </a>
            <div className="flex items-center justify-between">
              <a 
                href={`https://youtube.com/channel/${video.channelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-600 hover:text-indigo-600"
              >
                {video.channelTitle}
              </a>
              <span className="text-xs text-gray-500">
                {new Date(video.publishedAt).toLocaleDateString()}
              </span>
            </div>
            {transcriptStatus?.videoId === video.videoId && transcriptStatus.status === 'error' ? (
              <div className="flex items-center space-x-2 mt-3 text-sm font-medium text-red-500">
                <XCircle className="w-4 h-4" />
                <span>No Transcript</span>
              </div>
            ) : (
              <button
                onClick={() => handleDownloadTranscript(video.videoId, video.title, video.channelTitle)}
                disabled={transcriptStatus?.videoId === video.videoId && transcriptStatus.status === 'loading'}
                className="flex items-center space-x-2 mt-3 text-sm font-medium text-gray-700 hover:text-indigo-600 disabled:opacity-50"
                title="Download Transcript"
              >
                {transcriptStatus?.videoId === video.videoId ? (
                  transcriptStatus.status === 'loading' ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : transcriptStatus.status === 'success' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">Downloaded</span>
                    </>
                  ) : null
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Get Transcript</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="sticky top-0 px-6 py-3 text-left bg-gray-50 border-b border-gray-200 z-20">
            <input
              type="checkbox"
              checked={selectedVideos.length === results.length}
              onChange={handleSelectAll}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </th>
          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 z-20">
            Video
          </th>
          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 z-20">
            Channel
          </th>
          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 z-20">
            Published
          </th>
          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 z-20">
            Transcript
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {results.map((video) => (
          <tr key={video.id} className="hover:bg-gray-50">
            <td className="px-6 py-4">
              <input
                type="checkbox"
                checked={selectedVideos.includes(video.videoId)}
                onChange={() => handleSelectVideo(video.videoId)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </td>
            <td className="px-6 py-4">
              <div className="flex items-start space-x-4">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-32 h-20 object-cover rounded-md"
                />
                <div>
                  <a 
                    href={`https://youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                  >
                    {video.title}
                  </a>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <a 
                href={`https://youtube.com/channel/${video.channelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-900 hover:text-indigo-600 flex items-center space-x-1"
              >
                <span>{video.channelTitle}</span>
              </a>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-500">
                {new Date(video.publishedAt).toLocaleDateString()}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {transcriptStatus?.videoId === video.videoId && transcriptStatus.status === 'error' ? (
                <div className="flex items-center space-x-2 text-sm font-medium text-red-500">
                  <XCircle className="w-4 h-4" />
                  <span>No Transcript Available</span>
                </div>
              ) : (
                <button
                  onClick={() => handleDownloadTranscript(video.videoId, video.title, video.channelTitle)}
                  disabled={transcriptStatus?.videoId === video.videoId && transcriptStatus.status === 'loading'}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-indigo-600 disabled:opacity-50"
                  title="Download Transcript"
                >
                  {transcriptStatus?.videoId === video.videoId ? (
                    transcriptStatus.status === 'loading' ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : transcriptStatus.status === 'success' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-500">Downloaded</span>
                      </>
                    ) : null
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Get Transcript</span>
                    </>
                  )}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="w-full">
      <div className="w-full px-4">
        <div className="w-full mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Search YouTube Videos
          </h1>
          <form onSubmit={handleSearch} className="w-full flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for videos..."
                className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        <div className="w-full mb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <VideoSearchFilters
              videoCount={videoCount}
              onVideoCountChange={setVideoCount}
              publishedAfter={publishedAfter}
              onPublishedAfterChange={setPublishedAfter}
              duration={duration}
              onDurationChange={setDuration}
            />
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setIsGridView(false)}
                className={`p-2 rounded-md transition-colors ${!isGridView 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title="List View"
              >
                <LayoutList className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsGridView(true)}
                className={`p-2 rounded-md transition-colors ${isGridView 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title="Grid View"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 font-medium break-words">{error.message}</p>
              </div>
              <button
                onClick={handleRetry}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-50 whitespace-nowrap ml-4"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
            {error.data && (
              <div className="mt-2">
                <pre className="p-2 bg-red-100 rounded text-sm overflow-x-auto whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">
                  {JSON.stringify(error.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {hasSearched && (
          <div className="w-full bg-white rounded-lg shadow">
            <div className="relative">
              {selectedVideos.length > 0 && (
                <div className="sticky top-16 bg-white border-b border-gray-200 z-30">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedVideos.length} video{selectedVideos.length > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowSaveToListPopup(true)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <BookmarkPlus className="w-4 h-4" />
                        <span>Save to List</span>
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {results.length === 0 && !error ? (
                <div className="p-6 text-center text-gray-500">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      <span>Searching...</span>
                    </div>
                  ) : (
                    'No videos found for your search criteria'
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    {isGridView ? renderGridView() : renderTableView()}
                  </div>

                  {isLoadingMore && (
                    <div className="p-4 flex justify-center">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Loading more videos...</span>
                      </div>
                    </div>
                  )}

                  {nextPageToken && totalFetched < videoCount && !isLoadingMore && (
                    <div className="p-4 flex justify-center">
                      <button
                        onClick={() => loadMoreVideos(nextPageToken)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        <span>Load More</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showSaveToListPopup && (
        <SaveToListPopup
          selectedChannels={[]}
          onClose={() => setShowSaveToListPopup(false)}
          onSave={handleSaveToList}
          existingLists={[]}
        />
      )}
    </div>
  );
};

export default VideoSearchPage;
export { VideoSearchPage };