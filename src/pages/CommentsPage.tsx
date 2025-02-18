import React, { useState, useEffect } from 'react';
import { MessageSquare, Link as LinkIcon, Loader2, AlertCircle, ArrowDown, Download, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { VideoDetails } from '../components/VideoDetails';
import { ChannelDetails } from '../components/ChannelDetails';
import { logger } from '../lib/logger';

interface Comment {
  id: string;
  text: string;
  authorName: string;
  authorProfileImage: string;
  likeCount: number;
  publishedAt: string;
  replyCount: number;
}

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

const getCommentCountOptions = (totalComments: number) => {
  if (totalComments <= 100) {
    return [totalComments];
  }

  const options = [100];
  if (totalComments > 100) options.push(200);
  if (totalComments > 200) options.push(1000);
  if (totalComments > 1000) options.push(totalComments);
  return options;
};

export const CommentsPage: React.FC = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<any | null>(null);
  const [channelDetails, setChannelDetails] = useState<any | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalFetched, setTotalFetched] = useState(0);
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [commentCount, setCommentCount] = useState<number>(100);
  const [totalComments, setTotalComments] = useState<number>(0);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [pendingCommentCount, setPendingCommentCount] = useState<number>(100);
  const [copied, setCopied] = useState(false);

  const extractVideoId = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;

    try {
      const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|attribution_link\?.*?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(regex);
      
      if (!match) return null;
      
      const videoId = match[1];
      if (videoId.length !== 11) return null;
      
      return videoId;
    } catch (err) {
      console.error('Error extracting video ID:', err);
      return null;
    }
  };

  const extractChannelId = (url: string): { id: string | null; handle: string | null } => {
    if (!url || typeof url !== 'string') return { id: null, handle: null };

    try {
      const idMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return { id: idMatch[1], handle: null };
      }

      const handleMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|@)([a-zA-Z0-9_-]+)/);
      if (handleMatch && handleMatch[1]) {
        return { id: null, handle: `@${handleMatch[1]}` };
      }

      if (url.startsWith('@')) {
        return { id: null, handle: url };
      }

      return { id: null, handle: null };
    } catch (err) {
      console.error('Error extracting channel information:', err);
      return { id: null, handle: null };
    }
  };

  const handleSubmit = async (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    const extractedVideoId = extractVideoId(inputUrl);
    const { id: extractedChannelId, handle: extractedHandle } = extractChannelId(inputUrl);

    if (!extractedVideoId && !extractedChannelId && !extractedHandle) {
      setError('Invalid URL. Please enter a valid YouTube video or channel URL.');
      return;
    }

    setError(null);
    setComments([]);
    setNextPageToken(null);
    setTotalFetched(0);
    setLoadingProgress(0);

    if (extractedVideoId) {
      setVideoId(extractedVideoId);
      setChannelId(null);
      setChannelDetails(null);
      await handleVideoComments(extractedVideoId);
    } else if (extractedChannelId || extractedHandle) {
      setChannelId(extractedChannelId);
      setVideoId(null);
      setVideoDetails(null);
      await handleChannelComments(extractedChannelId, extractedHandle);
    }
  };

  const handleVideoComments = async (videoId: string, count: number = 100) => {
    setIsLoadingVideo(true);
    setIsLoadingComments(true);

    try {
      const videoResponse = await fetch(
        `/youtube/video?videoID=${videoId}`
      );
      const videoData = await videoResponse.json();

      if (!videoResponse.ok) {
        throw new Error(videoData.error || 'Failed to fetch video details');
      }

      setVideoDetails(videoData);
      const totalAvailable = parseInt(videoData.statistics.commentCount);
      setTotalComments(totalAvailable);
      setIsLoadingVideo(false);

      if (totalAvailable <= 100) {
        setCommentCount(totalAvailable);
        setPendingCommentCount(totalAvailable);
      }

      const { comments: initialComments, nextPageToken: token } = await fetchComments(videoId);
      setComments(initialComments);
      setNextPageToken(token);
      setTotalFetched(initialComments.length);
      setIsLoadingComments(false);
      
      if (count > 100 && token) {
        await loadMoreComments(videoId, token, initialComments, false, count);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setIsLoadingVideo(false);
      setIsLoadingComments(false);
    }
  };

  const handleChannelComments = async (channelId: string | null, handle: string | null, count: number = 100) => {
    setIsLoadingChannel(true);
    setIsLoadingComments(true);

    try {
      const baseUrl = '/youtube/channel';
      const channelUrl = channelId 
        ? `${baseUrl}?channelID=${channelId}`
        : `${baseUrl}?handle=${handle}`;

      const channelResponse = await fetch(channelUrl);
      const channelData = await channelResponse.json();

      if (!channelResponse.ok) {
        throw new Error(channelData.error || 'Failed to fetch channel details');
      }

      setChannelDetails(channelData);
      setIsLoadingChannel(false);

      const actualChannelId = channelData.id;
      const { comments: newComments, nextPageToken: token } = await fetchComments(actualChannelId, true);
      setComments(newComments);
      setNextPageToken(token);
      setTotalFetched(newComments.length);

      if (count > 100 && token) {
        await loadMoreComments(actualChannelId, token, newComments, true, count);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoadingChannel(false);
      setIsLoadingComments(false);
    }
  };

  const loadMoreComments = async (id: string, token: string, currentComments: Comment[] = comments, isChannel: boolean = false, maxCount: number = commentCount) => {
    if (!token || isLoadingMore || totalFetched >= maxCount) return;

    setIsLoadingMore(true);
    try {
      const { comments: newComments, nextPageToken: newToken } = await fetchComments(id, isChannel, token);
      const updatedComments = [...currentComments, ...newComments];
      setComments(updatedComments);
      setNextPageToken(newToken);
      setTotalFetched(updatedComments.length);

      if (updatedComments.length < maxCount && newToken) {
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadMoreComments(id, newToken, updatedComments, isChannel, maxCount);
      }
    } catch (err) {
      console.error('Error loading more comments:', err);
      setError('Failed to load more comments');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const fetchComments = async (id: string, isChannel: boolean = false, pageToken?: string) => {
    const baseUrl = '/youtube';
    const endpoint = isChannel ? 'channel/comments' : 'comments';
    const paramName = isChannel ? 'channelID' : 'videoID';
    const searchUrl = `${baseUrl}/${endpoint}?${paramName}=${id}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    
    try {
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch comments');
      }

      const data = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format');
      }

      const newComments = data.items.map((item: any) => ({
        id: item.id,
        text: item.snippet.topLevelComment.snippet.textDisplay,
        authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
        authorProfileImage: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
        likeCount: item.snippet.topLevelComment.snippet.likeCount,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
        replyCount: item.snippet.totalReplyCount
      }));

      return {
        comments: newComments,
        nextPageToken: data.nextPageToken || null,
      };
    } catch (err) {
      throw err;
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedComments(comments.map(comment => comment.id));
    } else {
      setSelectedComments([]);
    }
  };

  const handleSelectComment = (commentId: string) => {
    setSelectedComments(prev => 
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const handleExportCSV = () => {
    const selectedCommentObjects = comments.filter(comment => 
      selectedComments.includes(comment.id)
    );

    const csvContent = [
      ['Author', 'Comment', 'Likes', 'Replies', 'Date', 'Profile URL'].join(','),
      ...selectedCommentObjects.map(comment => [
        `"${comment.authorName.replace(/"/g, '""')}"`,
        `"${comment.text.replace(/"/g, '""')}"`,
        comment.likeCount,
        comment.replyCount,
        new Date(comment.publishedAt).toLocaleDateString(),
        `"${comment.authorProfileImage}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `youtube_comments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySelected = async () => {
    const selectedCommentObjects = comments.filter(comment => 
      selectedComments.includes(comment.id)
    );

    // Create headers for the spreadsheet
    const headers = [
      'Author',
      'Comment',
      'Likes',
      'Replies',
      'Date',
      'Profile URL'
    ];

    // Create rows for each comment
    const rows = selectedCommentObjects.map(comment => [
      comment.authorName,
      comment.text.replace(/\n/g, ' '), // Replace newlines with spaces for better spreadsheet compatibility
      comment.likeCount,
      comment.replyCount,
      new Date(comment.publishedAt).toLocaleDateString(),
      comment.authorProfileImage
    ]);

    // Combine headers and rows, and convert to TSV (Tab-Separated Values)
    // TSV is better than CSV for this purpose because comments often contain commas
    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.map(cell => 
        // Properly escape cells for spreadsheet
        typeof cell === 'string' 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join('\t'))
    ].join('\n');

    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      logger.info('Comments copied to clipboard in spreadsheet format', { 
        count: selectedCommentObjects.length,
        format: 'TSV'
      });
    } catch (err) {
      logger.error('Failed to copy comments', err);
      setError('Failed to copy comments to clipboard');
    }
  };

  const handleApplyCommentCount = async () => {
    if (pendingCommentCount === commentCount) return;
    
    setCommentCount(pendingCommentCount);
    setComments([]);
    setNextPageToken(null);
    setTotalFetched(0);
    setLoadingProgress(0);

    if (videoId) {
      await handleVideoComments(videoId, pendingCommentCount);
    } else if (channelId) {
      await handleChannelComments(channelId, null, pendingCommentCount);
    }
  };

  useEffect(() => {
    const detectAndFetch = async () => {
      if (!inputUrl.trim()) return;

      const extractedVideoId = extractVideoId(inputUrl);
      const { id: extractedChannelId, handle: extractedHandle } = extractChannelId(inputUrl);

      if (extractedVideoId || extractedChannelId || extractedHandle) {
        handleSubmit(null);
      }
    };

    const timeoutId = setTimeout(detectAndFetch, 500);
    return () => clearTimeout(timeoutId);
  }, [inputUrl]);

  const sortedComments = [...comments].sort((a, b) => {
    return sortOrder === 'desc' 
      ? b.likeCount - a.likeCount 
      : a.likeCount - b.likeCount;
  });

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          YouTube Comments
        </h1>
        <p className="text-gray-600">
          Extract comments from any YouTube video or channel by pasting its URL below.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="input-url" className="block text-sm font-medium text-gray-700 mb-1">
              Video or Channel URL
            </label>
            <div className="relative">
              <input
                id="input-url"
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://www.youtube.com/channel/..."
                className="search-input pl-10"
              />
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[6px]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 break-words">{error}</p>
          </div>
        </div>
      )}

      {(videoId || channelId) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {videoDetails && (
              <VideoDetails
                videoId={videoId!}
                videoDetails={videoDetails}
                isLoading={isLoadingVideo}
              />
            )}
            {channelDetails && (
              <ChannelDetails
                channelDetails={channelDetails}
                isLoading={isLoadingChannel}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-4 border-b border-black/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Comments ({totalFetched})
                    </h2>
                    {totalComments > 0 && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={pendingCommentCount}
                          onChange={(e) => setPendingCommentCount(Number(e.target.value))}
                          className="select w-auto text-sm"
                        >
                          {getCommentCountOptions(totalComments).map(count => (
                            <option key={count} value={count}>
                              {count === totalComments 
                                ? `All Comments (${count.toLocaleString()})` 
                                : `${count.toLocaleString()} comments`}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleApplyCommentCount}
                          disabled={pendingCommentCount === commentCount || isLoadingComments}
                          className="btn-secondary text-sm"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedComments.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleCopySelected}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Selected</span>
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isLoadingMore && commentCount > 100 && (
                <div className="p-4 bg-blue-50 border-b border-blue-200">
                  <div className="flex items-center gap-4">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-blue-700">
                        <span>Loading more comments...</span>
                        <span>{totalFetched.toLocaleString()} / {commentCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingComments ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4" />
                          <div className="h-4 bg-gray-200 rounded w-full" />
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : comments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-black/10">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedComments.length === comments.length}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                          />
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comment
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Likes
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Replies
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-black/10">
                      {sortedComments.map((comment) => (
                        <tr key={comment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedComments.includes(comment.id)}
                              onChange={() => handleSelectComment(comment.id)}
                              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={comment.authorProfileImage}
                                alt={comment.authorName}
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="text-sm font-medium text-gray-900">
                                {comment.authorName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div 
                              className="text-sm text-gray-900"
                              dangerouslySetInnerHTML={{ __html: comment.text }}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {comment.likeCount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {comment.replyCount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(comment.publishedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {isLoadingMore && (
                <div className="p-4 flex justify-center">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading more comments...</span>
                  </div>
                </div>
              )}

              {nextPageToken && totalFetched < commentCount && !isLoadingMore && (
                <div className="p-4 flex justify-center">
                  <button
                    onClick={() => videoId && loadMoreComments(videoId, nextPageToken)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span>Load More</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};