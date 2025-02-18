import React, { useState } from 'react';
import { FileText, AlertCircle, Loader2, Link as LinkIcon, Brain, Sparkles } from 'lucide-react';
import { VideoDetails } from '../components/VideoDetails';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { logger } from '../lib/logger';

type SummaryType = 'bullet' | 'executive' | 'thematic' | 'timestamp' | 'qa';

interface SummaryOption {
  id: SummaryType;
  label: string;
  icon: React.ReactNode;
  description: string;
  apiCode: string;
}

const summaryOptions: SummaryOption[] = [
  {
    id: 'executive',
    label: 'Executive Overview',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'A comprehensive executive summary of the key points and insights',
    apiCode: 'executive'
  },
  {
    id: 'bullet',
    label: 'Bullet-Point Digest',
    icon: <FileText className="w-5 h-5" />,
    description: 'Key points organized in an easy-to-read bullet point format',
    apiCode: 'bullet'
  },
  {
    id: 'thematic',
    label: 'Thematic Breakdown',
    icon: <Brain className="w-5 h-5" />,
    description: 'Analysis of main themes and topics discussed in the video',
    apiCode: 'thematic'
  },
  {
    id: 'timestamp',
    label: 'Timestamp Navigator',
    icon: <FileText className="w-5 h-5" />,
    description: 'Timeline-based summary with key moments and topics',
    apiCode: 'timestamp'
  },
  {
    id: 'qa',
    label: 'Q&A',
    icon: <FileText className="w-5 h-5" />,
    description: 'Key information presented in a question and answer format',
    apiCode: 'qa'
  }
];

const SummaryPage: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<any | null>(null);
  const [summaryType, setSummaryType] = useState<SummaryType>('executive');
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [transcript, setTranscript] = useState<any | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

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
    setSummary('');
    setTranscript(null);
    setVideoDetails(null);

    const extractedVideoId = extractVideoId(videoUrl);
    if (!extractedVideoId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
      return;
    }

    setVideoId(extractedVideoId);
    setIsLoadingVideo(true);
    setIsSummarizing(true);

    // Close any existing event source
    if (eventSource) {
      eventSource.close();
    }

    try {
      const newEventSource = new EventSource(
        `https://server.theyoutubetool.com/ai/summarize?videoID=${extractedVideoId}&summary_type=${summaryType}`
      );

      setEventSource(newEventSource);

      // Handle connection open
      newEventSource.onopen = () => {
        logger.info('EventSource connection opened');
      };

      // Handle messages
      newEventSource.onmessage = (event) => {
        try {
          // Log raw event data for debugging
          logger.debug('Received event data:', event.data);

          // Try to parse the data
          let parsedData;
          try {
            parsedData = JSON.parse(event.data);
          } catch (parseError) {
            // If it's not JSON, treat it as a direct text chunk
            setSummary(prev => prev + event.data);
            return;
          }

          // Handle structured data
          if (parsedData && typeof parsedData === 'object') {
            switch (parsedData.type) {
              case 'video_info':
                if (parsedData.data?.snippet && parsedData.data?.statistics) {
                  setVideoDetails(parsedData.data);
                  setIsLoadingVideo(false);
                }
                break;

              case 'transcript':
                if (parsedData.data?.segments && Array.isArray(parsedData.data.segments)) {
                  setTranscript(parsedData.data);
                }
                break;

              case 'summary_start':
                setSummary('');
                break;

              case 'summary_chunk':
                if (typeof parsedData.data === 'string') {
                  setSummary(prev => prev + parsedData.data);
                }
                break;

              case 'summary_end':
                setIsSummarizing(false);
                newEventSource.close();
                break;

              case 'error':
                throw new Error(parsedData.message || 'An error occurred during summarization');
            }
          } else {
            // If the data is not structured but valid JSON, treat it as a summary chunk
            setSummary(prev => prev + event.data);
          }
        } catch (err) {
          logger.error('Error processing event:', {
            error: err,
            eventData: event.data
          });
          setError(err instanceof Error ? err.message : 'Failed to process response');
          setIsSummarizing(false);
          newEventSource.close();
        }
      };

      // Handle errors
      newEventSource.onerror = (err) => {
        logger.error('EventSource error:', {
          error: err,
          readyState: newEventSource.readyState
        });

        // Check if the connection was never established
        if (newEventSource.readyState === EventSource.CONNECTING) {
          setError('Could not connect to the server. Please check your internet connection and try again.');
        } else {
          setError('Connection error. The summary generation was interrupted. Please try again.');
        }

        setIsSummarizing(false);
        newEventSource.close();
      };
    } catch (err) {
      logger.error('Error setting up EventSource:', err);
      setError(err instanceof Error ? err.message : 'Failed to start summarization');
      setIsSummarizing(false);
      setIsLoadingVideo(false);
    }
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let key = 0;

    const processInlineFormatting = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    };

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={key++} className="mb-4">
            {currentList.map((item, i) => (
              <li key={i} className="ml-6 list-disc">
                <div dangerouslySetInnerHTML={{ __html: processInlineFormatting(item) }} />
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={key++} className="text-xl font-bold mb-3 mt-6">
            {trimmedLine.slice(4)}
          </h3>
        );
      } else if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={key++} className="text-2xl font-bold mb-4 mt-8">
            {trimmedLine.slice(3)}
          </h2>
        );
      } else if (trimmedLine.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={key++} className="text-3xl font-bold mb-6 mt-10">
            {trimmedLine.slice(2)}
          </h1>
        );
      } else if (trimmedLine.match(/^[-*]\s/)) {
        const bulletContent = trimmedLine.slice(2);
        if (bulletContent) {
          currentList.push(bulletContent);
        }
      } else if (trimmedLine) {
        flushList();
        elements.push(
          <p key={key++} className="mb-4" dangerouslySetInnerHTML={{ __html: processInlineFormatting(trimmedLine) }} />
        );
      } else if (!trimmedLine && currentList.length === 0) {
        elements.push(<br key={key++} />);
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          YouTube Video Summary
        </h1>
        <p className="text-gray-600">
          Get an AI-powered summary of any YouTube video by pasting its URL below.
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

          <div>
            <label htmlFor="summary-type" className="block text-sm font-medium text-gray-700 mb-1">
              Summary Type
            </label>
            <div className="relative">
              <select
                id="summary-type"
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value as SummaryType)}
                className="select"
              >
                {summaryOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {summaryOptions.find(opt => opt.id === summaryType)?.icon && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  {summaryOptions.find(opt => opt.id === summaryType)?.icon}
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {summaryOptions.find(opt => opt.id === summaryType)?.description}
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoadingVideo || !videoUrl.trim()}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {isLoadingVideo ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Get Summary</span>
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

          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="p-4 border-b border-black/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    AI YouTube Video Summary
                  </h2>
                  {isSummarizing ? (
                    <Loader2 className="w-5 h-5 text-black animate-spin" />
                  ) : summary ? (
                    <Sparkles className="w-5 h-5 text-green-500" />
                  ) : (
                    <Brain className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="p-6">
                {isSummarizing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-black animate-spin mb-4" />
                    <p className="text-gray-600">Generating summary...</p>
                  </div>
                ) : summary ? (
                  <div className="prose max-w-none">
                    {renderMarkdown(summary)}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Enter a YouTube URL to generate a summary</p>
                  </div>
                )}
              </div>
            </div>

            {transcript && (
              <TranscriptViewer
                transcript={transcript}
                isLoading={isLoadingVideo}
                error={error}
                videoId={videoId}
                videoTitle={videoDetails?.snippet?.title}
                channelTitle={videoDetails?.snippet?.channelTitle}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryPage;