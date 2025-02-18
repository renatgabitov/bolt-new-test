import React, { useState } from 'react';
import { ExternalLink, Globe, Twitter, Linkedin, Instagram, Mail, Link2, ArrowUpDown } from 'lucide-react';
import { CreatorSearchResult } from '../types';
import { SaveToListPopup } from './SaveToListPopup';

interface CreatorTableProps {
  channels: CreatorSearchResult[];
  onSave: (channels: CreatorSearchResult[], listId: string | null, listName: string) => void;
}

type SortField = 'title' | 'subscriber_count' | 'video_count' | 'total_topic_views';
type SortDirection = 'asc' | 'desc';

export const CreatorTable: React.FC<CreatorTableProps> = ({ channels, onSave }) => {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [sortField, setSortField] = useState<SortField>('subscriber_count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedChannels = [...channels].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const aValue = a[sortField] || 0;
    const bValue = b[sortField] || 0;
    return (aValue - bValue) * direction;
  });

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedChannels(channels.map((channel) => channel.channel_id));
    } else {
      setSelectedChannels([]);
    }
  };

  const handleSaveToList = (listId: string | null, listName: string) => {
    const selectedChannelObjects = channels.filter((channel) =>
      selectedChannels.includes(channel.channel_id)
    );
    onSave(selectedChannelObjects, listId, listName);
    setSelectedChannels([]);
    setShowSavePopup(false);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return <ArrowUpDown className="w-4 h-4" />;
  };

  return (
    <>
      {selectedChannels.length > 0 && (
        <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-40 border-b border-gray-200">
          <div className="w-full px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedChannels.length} channel{selectedChannels.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={() => setShowSavePopup(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Save to List
            </button>
          </div>
        </div>
      )}

      <div className="min-w-full inline-block align-middle">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                <input
                  type="checkbox"
                  checked={selectedChannels.length === channels.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/4"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2">
                  Channel
                  {renderSortIcon('title')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-[150px]"
                onClick={() => handleSort('subscriber_count')}
              >
                <div className="flex items-center gap-2">
                  Subscribers
                  {renderSortIcon('subscriber_count')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-[120px]"
                onClick={() => handleSort('video_count')}
              >
                <div className="flex items-center gap-2">
                  Total Videos
                  {renderSortIcon('video_count')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-[120px]"
                onClick={() => handleSort('total_topic_views')}
              >
                <div className="flex items-center gap-2">
                  Topic Videos
                  {renderSortIcon('total_topic_views')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Relevant Videos
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                Social Links
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedChannels.map((channel) => (
              <tr key={channel.channel_id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(channel.channel_id)}
                    onChange={() => handleSelectChannel(channel.channel_id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {channel.relevant_videos?.[0]?.thumbnail_url && (
                      <img 
                        className="h-10 w-10 rounded-full object-cover"
                        src={channel.relevant_videos[0].thumbnail_url}
                        alt=""
                      />
                    )}
                    <div className="ml-4">
                      <a 
                        href={`https://youtube.com/channel/${channel.channel_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {channel.title}
                      </a>
                      <div className="text-sm text-gray-500 line-clamp-2">{channel.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {channel.subscriber_count?.toLocaleString() || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {channel.video_count.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {channel.relevant_videos?.length || 0}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {channel.relevant_videos && channel.relevant_videos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {channel.relevant_videos.slice(0, 3).map((video) => (
                        <a
                          key={video.video_id}
                          href={`https://youtube.com/watch?v=${video.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group"
                        >
                          <div className="aspect-video rounded-lg overflow-hidden">
                            {video.thumbnail_url && (
                              <img 
                                src={video.thumbnail_url} 
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                              />
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600">
                              {video.title}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              {video.view_count.toLocaleString()} views
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No relevant videos found</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {channel.social_media.website && (
                      <a
                        href={channel.social_media.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-indigo-600"
                        title="Website"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {channel.social_media.twitter && (
                      <a
                        href={channel.social_media.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-indigo-600"
                        title="Twitter"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {channel.social_media.linkedin && (
                      <a
                        href={channel.social_media.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-indigo-600"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {channel.social_media.instagram && (
                      <a
                        href={channel.social_media.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-indigo-600"
                        title="Instagram"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {channel.social_media.email && (
                      <a
                        href={`mailto:${channel.social_media.email}`}
                        className="text-gray-400 hover:text-indigo-600"
                        title="Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showSavePopup && (
        <SaveToListPopup
          selectedChannels={channels.filter((channel) =>
            selectedChannels.includes(channel.channel_id)
          )}
          onClose={() => setShowSavePopup(false)}
          onSave={handleSaveToList}
          existingLists={[]}
        />
      )}
    </>
  );
};