import React, { useState } from 'react';
import { FileText, AlertCircle, Loader2, Link as LinkIcon } from 'lucide-react';
import { VideoDetails } from '../components/VideoDetails';
import { TranscriptViewer } from '../components/TranscriptViewer';
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

interface VideoDetailsResponse {
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
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
    defaultLanguage?: string;
    localized?: {
      title: string;
      description: string;
    };
    defaultAudioLanguage?: string;
  };
  contentDetails?: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    contentRating: Record<string, unknown>;
    projection: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}

const TranscriptPage: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetailsResponse | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

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
      logger.error('Error extracting video ID:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTranscript(null);

    const extractedVideoId = extractVideoId(videoUrl);
    if (!extractedVideoId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
      return;
    }

    setVideoId(extractedVideoId);
    setIsLoadingVideo(true);
    setIsLoadingTranscript(true);

    try {
      // Fetch video details first
      const videoResponse = await fetch(
        `/youtube/video?videoID=${extractedVideoId}`
      );
      
      let videoData: VideoDetailsResponse;
      try {
        videoData = await videoResponse.json();
      } catch (err) {
        logger.error('Error parsing video response:', err);
        throw new Error('Invalid response from video API');
      }

      if (!videoResponse.ok) {
        throw new Error(videoData.error || 'Failed to fetch video details');
      }

      setVideoDetails(videoData);
      setIsLoadingVideo(false);

      // Set default language from video if available
      const defaultLang = videoData.snippet?.defaultAudioLanguage || 'en';
      setSelectedLanguage(defaultLang);

      // Then fetch transcript
      const transcriptResponse = await fetch(
        `https://server.theyoutubetool.com/youtube-transcript?videoID=${extractedVideoId}&lang=${defaultLang}`
      );
      
      let transcriptData: TranscriptResponse;
      try {
        transcriptData = await transcriptResponse.json();
      } catch (err) {
        logger.error('Error parsing transcript response:', err);
        throw new Error('Invalid response from transcript API');
      }

      if (!transcriptResponse.ok) {
        throw new Error(transcriptData.error || 'Failed to fetch transcript');
      }

      if (!transcriptData.content || !Array.isArray(transcriptData.content) || transcriptData.content.length === 0) {
        throw new Error('No transcript available for this video');
      }

      setTranscript(transcriptData);
    } catch (err) {
      logger.error('Error fetching video data:', {
        error: err,
        videoId: extractedVideoId,
        videoUrl
      });
      
      setError(err instanceof Error ? err.message : 'Failed to fetch data. Please try again.');
    } finally {
      setIsLoadingVideo(false);
      setIsLoadingTranscript(false);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    if (!videoId || !lang) return;

    setIsLoadingTranscript(true);
    setError(null);

    try {
      const response = await fetch(
        `/youtube-transcript?videoID=${videoId}&lang=${lang}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transcript');
      }

      if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
        throw new Error('No transcript available in this language');
      }

      setTranscript(data);
      setSelectedLanguage(lang);
    } catch (err) {
      logger.error('Error fetching transcript:', {
        error: err,
        videoId,
        language: lang
      });
      setError(err instanceof Error ? err.message : 'Failed to fetch transcript');
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          YouTube Video Transcript
        </h1>
        <p className="text-gray-600">
          Get the transcript of any YouTube video by pasting its URL below.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-1">
              Video URL
            </label>
            <div className="relative">
              <input
                id="video-url"
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="search-input pl-10"
              />
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoadingVideo || isLoadingTranscript || !videoUrl.trim()}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {(isLoadingVideo || isLoadingTranscript) ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Get Transcript</span>
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

      {videoId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {videoDetails && (
              <VideoDetails
                videoId={videoId}
                videoDetails={videoDetails}
                isLoading={isLoadingVideo}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            {transcript?.availableLangs && transcript.availableLangs.length > 0 && (
              <div className="card p-4 mb-6">
                <div className="flex items-center gap-4">
                  <label htmlFor="language" className="text-sm font-medium text-gray-700">
                    Transcript Language:
                  </label>
                  <select
                    id="language"
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="select flex-1"
                    disabled={isLoadingTranscript}
                  >
                    {transcript.availableLangs.map((lang) => (
                      <option key={lang} value={lang}>
                        {new Intl.DisplayNames([lang], { type: 'language' }).of(lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <TranscriptViewer
              transcript={transcript}
              isLoading={isLoadingTranscript}
              error={error}
              videoId={videoId}
              videoTitle={videoDetails?.snippet?.title}
              channelTitle={videoDetails?.snippet?.channelTitle}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptPage;