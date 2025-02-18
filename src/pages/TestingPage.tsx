import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const TestingPage = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Implement your own API call here
      setResponse('API response will appear here');
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full px-4">
      <div className="w-full mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          API Testing
        </h1>
        <p className="text-gray-600 mb-6">
          Test API integration by entering a query below.
        </p>
        <form onSubmit={handleSearch} className="w-full flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query..."
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Test API'}
          </button>
        </form>
      </div>

      {error && (
        <div className="w-full p-4 mb-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {response && (
        <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Response:</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
          </div>
        </div>
      )}
    </div>
  );
};