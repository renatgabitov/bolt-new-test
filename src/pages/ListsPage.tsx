import React, { useState } from 'react';
import { Plus, Trash2, Edit2, ChevronRight, Users, Eye } from 'lucide-react';
import { SavedList } from '../types';

// Mock data for development
const mockLists: SavedList[] = [
  {
    id: '1',
    userId: 'user1',
    name: 'Tech Reviewers',
    channels: [
      {
        id: '1',
        title: 'TechInsights',
        description: 'In-depth tech reviews and analysis',
        email: 'contact@techinsights.com',
        subscriberCount: 500000,
        videoCount: 300,
        viewCount: 25000000,
        country: 'US',
        language: 'en',
        topics: ['Technology', 'Reviews'],
        publishedAt: '2020-01-01',
        lastPosted: '2024-02-20',
        channelType: 'business',
        thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
        recentVideos: [],
        socialLinks: {}
      },
      {
        id: '2',
        title: 'Tech Reviews Daily',
        description: 'Daily tech reviews and news',
        email: 'contact@techreviewsdaily.com',
        subscriberCount: 750000,
        videoCount: 500,
        viewCount: 35000000,
        country: 'UK',
        language: 'en',
        topics: ['Technology', 'Reviews'],
        publishedAt: '2019-01-01',
        lastPosted: '2024-02-21',
        channelType: 'business',
        thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
        recentVideos: [],
        socialLinks: {}
      }
    ],
    createdAt: '2024-02-01',
    updatedAt: '2024-02-20'
  },
  {
    id: '2',
    userId: 'user1',
    name: 'Marketing Experts',
    channels: [
      {
        id: '3',
        title: 'Marketing Pro',
        description: 'Marketing strategies and tips',
        email: 'contact@marketingpro.com',
        subscriberCount: 250000,
        videoCount: 200,
        viewCount: 15000000,
        country: 'US',
        language: 'en',
        topics: ['Marketing', 'Business'],
        publishedAt: '2021-01-01',
        lastPosted: '2024-02-19',
        channelType: 'business',
        thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
        recentVideos: [],
        socialLinks: {}
      }
    ],
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15'
  }
];

export const ListsPage = () => {
  const [lists, setLists] = useState<SavedList[]>(mockLists);
  const [editingList, setEditingList] = useState<string | null>(null);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleCreateList = () => {
    if (!newListName.trim()) return;

    const newList: SavedList = {
      id: Date.now().toString(),
      userId: 'user1', // This would come from auth context
      name: newListName,
      channels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setLists([...lists, newList]);
    setNewListName('');
    setShowNewListModal(false);
  };

  const handleDeleteList = (listId: string) => {
    setLists(lists.filter(list => list.id !== listId));
  };

  const handleUpdateListName = (listId: string, newName: string) => {
    setLists(lists.map(list => 
      list.id === listId 
        ? { ...list, name: newName, updatedAt: new Date().toISOString() }
        : list
    ));
    setEditingList(null);
  };

  const calculateListStats = (list: SavedList) => {
    const totalSubscribers = list.channels.reduce((sum, channel) => sum + channel.subscriberCount, 0);
    const totalViews = list.channels.reduce((sum, channel) => sum + channel.viewCount, 0);
    const businessChannels = list.channels.filter(channel => channel.channelType === 'business').length;
    const personalChannels = list.channels.filter(channel => channel.channelType === 'personal').length;

    return {
      totalSubscribers,
      totalViews,
      businessChannels,
      personalChannels
    };
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Lists</h1>
        <button
          onClick={() => setShowNewListModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          <span>New List</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                List Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creators
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Subscribers
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Views
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business/Personal
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lists.map(list => {
              const stats = calculateListStats(list);
              return (
                <tr key={list.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {editingList === list.id ? (
                        <input
                          type="text"
                          value={list.name}
                          onChange={(e) => handleUpdateListName(list.id, e.target.value)}
                          onBlur={() => setEditingList(null)}
                          autoFocus
                          className="text-sm text-gray-900 border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{list.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{list.channels.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{stats.totalSubscribers.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{stats.totalViews.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {stats.businessChannels}/{stats.personalChannels}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(list.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setEditingList(list.id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-500">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New List</h2>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewListModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};