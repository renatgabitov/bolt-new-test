import React from 'react';
import { Calendar, Info } from 'lucide-react';
import { SearchFilters as SearchFiltersType } from '../types';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFilterChange: (filters: SearchFiltersType) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onFilterChange }) => {
  const handleTimeRangeChange = (range: string) => {
    const now = new Date();
    let date = new Date();

    switch (range) {
      case '7d':
        date.setDate(now.getDate() - 7);
        break;
      case '30d':
        date.setDate(now.getDate() - 30);
        break;
      case '1y':
        date.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        return; // Don't update the date for custom option
      default:
        date = new Date(range); // For custom date input
    }

    onFilterChange({
      ...filters,
      published_after: date.toISOString()
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-6 py-4">
      <div className="flex items-start gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-gray-700">Videos to fetch</label>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400" />
              <div className="hidden group-hover:block absolute left-full ml-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-48">
                Number of videos to analyze per channel. Higher numbers provide more accurate results but take longer.
              </div>
            </div>
          </div>
          <select
            value={filters.max_videos || 50}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            onChange={(e) => onFilterChange({ ...filters, max_videos: Number(e.target.value) })}
          >
            <option value={50}>50 videos</option>
            <option value={100}>100 videos</option>
            <option value={200}>200 videos</option>
            <option value={500}>500 videos</option>
          </select>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-gray-700">Published after</label>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400" />
              <div className="hidden group-hover:block absolute left-full ml-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg w-48">
                Only include videos published after this date
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filters.published_after ? '7d' : 'custom'}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="1y">Last year</option>
              <option value="custom">Custom date</option>
            </select>

            {filters.published_after === 'custom' && (
              <div className="relative">
                <input
                  type="date"
                  value={filters.published_after?.split('T')[0] || ''}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};