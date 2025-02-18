import React from 'react';
import { Users, Clock } from 'lucide-react';
import { CreatorSearchResponse } from '../types';

interface SearchStatsProps {
  data: CreatorSearchResponse | null;
}

export const SearchStats: React.FC<SearchStatsProps> = ({ data }) => {
  if (!data) return null;

  const totalSubscribers = data.channels.reduce((sum, channel) => 
    sum + (channel.subscriber_count || 0), 0);

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-lg border border-black/5 p-4 mb-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-black/5 rounded-lg">
            <Users className="w-4 h-4 text-black/60" />
          </div>
          <div>
            <div className="text-sm font-medium text-black/40">Creators Found</div>
            <div className="text-base font-medium text-black/80">
              {data.total_channels_found.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 bg-black/5 rounded-lg">
            <Users className="w-4 h-4 text-black/60" />
          </div>
          <div>
            <div className="text-sm font-medium text-black/40">Total Subscribers</div>
            <div className="text-base font-medium text-black/80">
              {totalSubscribers.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 bg-black/5 rounded-lg">
            <Clock className="w-4 h-4 text-black/60" />
          </div>
          <div>
            <div className="text-sm font-medium text-black/40">API Calls</div>
            <div className="text-base font-medium text-black/80">
              {data.api_metrics.total_api_calls}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};