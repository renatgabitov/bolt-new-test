import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface VideoSearchFiltersProps {
  videoCount: number;
  onVideoCountChange: (count: number) => void;
  publishedAfter: string;
  onPublishedAfterChange: (date: string) => void;
  duration: string;
  onDurationChange: (duration: string) => void;
}

type TimeRange = '1h' | '24h' | '1w' | '30d' | '1y' | 'all' | 'custom';

export const VideoSearchFilters: React.FC<VideoSearchFiltersProps> = ({
  videoCount,
  onVideoCountChange,
  publishedAfter,
  onPublishedAfterChange,
  duration,
  onDurationChange
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1w');
  const [customDate, setCustomDate] = useState(publishedAfter.split('T')[0]);
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [customCountInput, setCustomCountInput] = useState('');

  const handleVideoCountChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomCount(true);
      setCustomCountInput(videoCount.toString());
    } else {
      setIsCustomCount(false);
      onVideoCountChange(Number(value));
    }
  };

  const handleCustomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCountInput(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      onVideoCountChange(numValue);
    }
  };

  const calculateDateFromRange = (range: TimeRange): string => {
    const now = new Date();
    
    switch (range) {
      case '1h':
        now.setHours(now.getHours() - 1);
        break;
      case '24h':
        now.setDate(now.getDate() - 1);
        break;
      case '1w':
        now.setDate(now.getDate() - 7);
        break;
      case '30d':
        now.setDate(now.getDate() - 30);
        break;
      case '1y':
        now.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        now.setFullYear(2005); // YouTube's founding year
        break;
      default:
        return publishedAfter;
    }
    
    return formatDate(now);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range);
    if (range !== 'custom') {
      const newDate = calculateDateFromRange(range);
      onPublishedAfterChange(newDate);
      setCustomDate(newDate.split('T')[0]);
    }
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setCustomDate(date);
    setSelectedTimeRange('custom');
    if (date) {
      onPublishedAfterChange(`${date}T00:00:00Z`);
    } else {
      // If date is cleared, set to 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const formattedDate = formatDate(sevenDaysAgo);
      onPublishedAfterChange(formattedDate);
      setCustomDate(formattedDate.split('T')[0]);
      setSelectedTimeRange('1w');
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00Z`;
  };

  return (
    <div className="flex flex-wrap items-center gap-4 py-4 min-w-max">
      <div className="flex items-center gap-2">
        {!isCustomCount ? (
          <select
            value={videoCount}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            onChange={(e) => handleVideoCountChange(e.target.value)}
          >
            <option value="10">10 videos</option>
            <option value="25">25 videos</option>
            <option value="50">50 videos</option>
            <option value="100">100 videos</option>
            <option value="custom">Custom number...</option>
          </select>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={customCountInput}
              onChange={handleCustomCountChange}
              className="w-24 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter number"
            />
            <button
              onClick={() => setIsCustomCount(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedTimeRange}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          onChange={(e) => handleTimeRangeChange(e.target.value as TimeRange)}
        >
          <option value="1h">Last hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="1w">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="1y">Last year</option>
          <option value="all">All time</option>
          <option value="custom">Custom date</option>
        </select>

        {selectedTimeRange === 'custom' && (
          <div className="relative">
            <input
              type="date"
              value={customDate}
              max={new Date().toISOString().split('T')[0]}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onChange={handleCustomDateChange}
            />
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={duration}
          onChange={(e) => onDurationChange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="any">Any duration</option>
          <option value="short">Short (&lt; 4 minutes)</option>
          <option value="medium">Medium (4-20 minutes)</option>
          <option value="long">Long (&gt; 20 minutes)</option>
        </select>
      </div>
    </div>
  );
};