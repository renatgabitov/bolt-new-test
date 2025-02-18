import React, { useState } from 'react';
import { FileText, Download, Copy, Loader2 } from 'lucide-react';

interface TranscriptItem {
  lang: string;
  text: string;
  offset: number;
  duration: number;
}

interface TranscriptResponse {
  lang: string;
  availableLangs: string[];
  content: TranscriptItem[];
}

interface TranscriptViewerProps {
  transcript: TranscriptResponse | null;
  isLoading?: boolean;
  error?: string | null;
  videoId?: string;
  videoTitle?: string;
  channelTitle?: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  isLoading = false,
  error = null,
  videoId,
  videoTitle,
  channelTitle
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!transcript?.content) return;

    const content = transcript.content.map(item => {
      const time = formatTime(item.offset);
      return `[${time}] ${item.text}`;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    if (!transcript?.content) return;

    const content = transcript.content.map(item => {
      const time = formatTime(item.offset);
      return `[${time}] ${item.text}`;
    }).join('\n\n');

    const fileName = videoId 
      ? `transcript-${videoId}.txt` 
      : 'transcript.txt';
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const formatTime = (offset: number): string => {
    const totalSeconds = Math.floor(offset / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <div className="card">
      <div className="p-4 border-b border-black/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-medium text-gray-900">Transcript</h2>
            {transcript?.lang && (
              <span className="text-sm text-gray-500">({transcript.lang.toUpperCase()})</span>
            )}
          </div>
          {transcript?.content && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCopy}
                className="btn-secondary flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-gray-500">
          {error}
        </div>
      ) : transcript?.content ? (
        <div className="divide-y divide-black/10 max-h-[600px] overflow-y-auto">
          {transcript.content.map((item, index) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <div className="flex items-start">
                <span className="text-sm font-medium text-gray-900 w-24 flex-shrink-0 font-mono">
                  {formatTime(item.offset)}
                </span>
                <p className="text-gray-900 flex-1">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          No transcript available
        </div>
      )}
    </div>
  );
};