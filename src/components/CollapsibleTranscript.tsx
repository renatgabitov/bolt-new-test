import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { TranscriptViewer } from './TranscriptViewer';
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

interface CollapsibleTranscriptProps {
  videoId: string;
  videoTitle?: string;
  channelTitle?: string;
}

export const CollapsibleTranscript: React.FC<CollapsibleTranscriptProps> = ({
  videoId,
  videoTitle,
  channelTitle
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  React.useEffect(() => {
    const fetchTranscript = async () => {
      if (!videoId) return;
      
      setIsLoading(true);
      setError(null);
      setTranscript(null);
      setHasLoaded(false);

      try {
        const response = await fetch(
          `/youtube/transcript-3?videoID=${videoId}`
        );
        
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch transcript');
        }

        if (!data || !data.content || !Array.isArray(data.content) || data.content.length === 0) {
          throw new Error('No transcript available for this video');
        }

        // Validate transcript data structure
        if (!data.lang || !data.availableLangs) {
          logger.warn('Transcript response missing expected fields', data);
          data.lang = data.lang || 'en';
          data.availableLangs = data.availableLangs || [data.lang];
        }

        setTranscript(data);
        setError(null);
        setHasLoaded(true);
      } catch (err) {
        logger.error('Error fetching transcript:', {
          error: err,
          videoId,
          context: 'CollapsibleTranscript'
        });
        
        setError(
          err instanceof Error 
            ? err.message 
            : 'Failed to load transcript'
        );
        setTranscript(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranscript();
  }, [videoId]);

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-900">Video Transcript</span>
          {isLoading ? (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center space-x-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          ) : hasLoaded ? (
            <div className="flex items-center space-x-2 text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">
                Available {transcript?.lang && `(${transcript.lang.toUpperCase()})`}
              </span>
            </div>
          ) : null}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4">
          <TranscriptViewer
            transcript={transcript}
            isLoading={isLoading}
            error={error}
            videoId={videoId}
            videoTitle={videoTitle}
            channelTitle={channelTitle}
          />
        </div>
      )}
    </div>
  );
};