import React, { useState } from 'react';
import { FileText, AlertCircle, Download, Loader2, Link as LinkIcon } from 'lucide-react';
import { VideoDetails } from '../components/VideoDetails';

interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  fps: number;
  filesize: number;
  tbr: number;
  protocol: string;
  vcodec: string;
  acodec: string;
  abr: number;
  asr: number;
  quality: string;
}

interface VideoMetadata {
  title: string;
  formats: VideoFormat[];
}

const SUPPORTED_RESOLUTIONS = [
  { label: '4K', value: '2160' },
  { label: '1440p', value: '1440' },
  { label: '1080p', value: '1080' },
  { label: '720p', value: '720' },
  { label: '480p', value: '480' },
  { label: '360p', value: '360' }
];

export const DownloadPage: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isLoadingFormats, setIsLoadingFormats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<any | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedExt, setSelectedExt] = useState<'mp4' | 'webm'>('mp4');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const extractedVideoId = extractVideoId(videoUrl);
    if (!extractedVideoId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
      return;
    }

    setVideoId(extractedVideoId);
    setIsLoadingVideo(true);
    setIsLoadingFormats(true);

    try {
      // Fetch video details first
      const videoResponse = await fetch(
        `/youtube/video?videoID=${extractedVideoId}`
      );
      const videoData = await videoResponse.json();

      if (!videoResponse.ok) {
        throw new Error(videoData.error || 'Failed to fetch video details');
      }

      setVideoDetails(videoData);
      setIsLoadingVideo(false);

      // Fetch formats using new endpoint structure
      const formatsResponse = await fetch(
        `/youtube/resolution?videoID=${extractedVideoId}&proxie=false`
      );
      
      if (!formatsResponse.ok) {
        throw new Error('Failed to fetch video formats');
      }

      const formatsData = await formatsResponse.json();
      setMetadata(formatsData);

      // Select highest quality format by default
      const filteredFormats = filterFormats(formatsData.formats, selectedExt);
      if (filteredFormats.length > 0) {
        setSelectedFormatId(filteredFormats[0].format_id);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch video information');
    } finally {
      setIsLoadingVideo(false);
      setIsLoadingFormats(false);
    }
  };

  const filterFormats = (formats: VideoFormat[], ext: string): VideoFormat[] => {
    const resolutionMap = new Map<string, VideoFormat>();

    formats
      .filter(format => {
        const resolution = format.resolution?.split('x')[1];
        return (
          format.ext === ext &&
          resolution &&
          SUPPORTED_RESOLUTIONS.some(res => res.value === resolution)
        );
      })
      .forEach(format => {
        const resolution = format.resolution?.split('x')[1];
        if (!resolution) return;

        const existingFormat = resolutionMap.get(resolution);
        
        if (!existingFormat || 
            (format.filesize && !existingFormat.filesize) ||
            (format.filesize && existingFormat.filesize && format.tbr > existingFormat.tbr)) {
          resolutionMap.set(resolution, format);
        }
      });

    return Array.from(resolutionMap.values())
      .sort((a, b) => {
        const resA = parseInt(a.resolution?.split('x')[1] || '0');
        const resB = parseInt(b.resolution?.split('x')[1] || '0');
        return resB - resA;
      });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newExt = e.target.value as 'mp4' | 'webm';
    setSelectedExt(newExt);
    if (metadata) {
      const filteredFormats = filterFormats(metadata.formats, newExt);
      setSelectedFormatId(filteredFormats.length > 0 ? filteredFormats[0].format_id : null);
    }
  };

  const handleDownload = async () => {
    if (!videoId || !selectedFormatId) return;
    
    setIsDownloading(true);
    
    try {
      // Use new endpoint structure for download
      const downloadUrl = `/youtube/stream?videoID=${videoId}&formatID=${selectedFormatId}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${metadata?.title || 'video'}.${selectedExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to initiate download');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          YouTube Video Downloader
        </h1>
        <p className="text-gray-600">
          Download YouTube videos in your preferred quality and format.
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
            disabled={isLoadingVideo || isLoadingFormats || !videoUrl.trim()}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {isLoadingVideo || isLoadingFormats ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Get Video</span>
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
            <div className="card">
              <div className="p-4 border-b border-black/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Available Formats</h2>
                  <select
                    value={selectedExt}
                    onChange={handleFormatChange}
                    className="select w-auto ml-4"
                  >
                    <option value="mp4">MP4</option>
                    <option value="webm">WebM</option>
                  </select>
                </div>
              </div>

              {isLoadingFormats ? (
                <div className="p-6">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="w-6 h-6 text-black animate-spin" />
                      <div>
                        <p className="text-gray-900 font-medium">Getting available formats...</p>
                        <p className="text-gray-700 text-sm">It typically takes 5 seconds to load.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : metadata ? (
                <div className="p-6 space-y-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-black/10">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Select
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quality
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-black/10">
                        {filterFormats(metadata.formats, selectedExt).map((format) => (
                          <tr key={format.format_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="radio"
                                name="format"
                                value={format.format_id}
                                checked={selectedFormatId === format.format_id}
                                onChange={() => setSelectedFormatId(format.format_id)}
                                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">
                                {format.resolution?.split('x')[1]}p
                                {format.fps ? ` ${format.fps}fps` : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">
                                {formatFileSize(format.filesize)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={handleDownload}
                    disabled={!selectedFormatId || isDownloading}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Preparing Download...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Download Video</span>
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};