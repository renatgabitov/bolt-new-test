import React, { useState } from 'react';
import { Search, AlertCircle, Loader2 } from 'lucide-react';
import { SearchFilters } from '../components/SearchFilters';
import { SearchStats } from '../components/SearchStats';
import { CreatorTable } from '../components/CreatorTable';
import { CreatorSearchResponse, SearchFilters as SearchFiltersType } from '../types';
import { logger } from '../lib/logger';

export const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFiltersType>({
    max_videos: 50,
    max_channels: 10,
    published_after: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  const [searchResults, setSearchResults] = useState<CreatorSearchResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        keyword: searchQuery,
        ...(filters.max_videos && { max_videos: filters.max_videos.toString() }),
        ...(filters.max_channels && { max_channels: filters.max_channels.toString() }),
        ...(filters.published_after && { published_after: filters.published_after })
      });

      const response = await fetch(`https://server.theyoutubetool.com/creator-search?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to search creators');
      }

      setSearchResults(data);
      logger.info('Creator search completed', {
        query: searchQuery,
        filters,
        resultsCount: data.total_channels_found,
        metrics: data.api_metrics
      });
    } catch (err) {
      logger.error('Creator search failed', {
        error: err,
        query: searchQuery,
        filters
      });
      setError(err instanceof Error ? err.message : 'Failed to search creators');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChannels = async (channels: any[], listId: string | null, listName: string) => {
    // TODO: Implement save to list functionality
    logger.info('Saving channels to list', { listId, listName, channelCount: channels.length });
  };

  return (
    <div className="w-full">
      <div className="w-full px-4">
        <div className="w-full mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Find YouTube Creators
          </h1>
          <form onSubmit={handleSearch} className="w-full flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for creators (e.g., 'SaaS marketing')"
                className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="w-full mb-6 border-b border-gray-200">
          <SearchFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 break-words">{error}</p>
            </div>
          </div>
        )}

        {hasSearched && (
          <>
            <SearchStats data={searchResults} />
            
            {searchResults && (
              <div className="w-full bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                  <CreatorTable
                    channels={searchResults.channels}
                    onSave={handleSaveChannels}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};