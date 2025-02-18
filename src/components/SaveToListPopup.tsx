import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { SavedList, YouTubeChannel } from '../types';

interface SaveToListPopupProps {
  selectedChannels: YouTubeChannel[];
  onClose: () => void;
  onSave: (listId: string | null, listName: string) => void;
  existingLists: SavedList[];
}

export const SaveToListPopup: React.FC<SaveToListPopupProps> = ({
  selectedChannels,
  onClose,
  onSave,
  existingLists,
}) => {
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleSave = () => {
    if (isCreatingNew) {
      onSave(null, newListName);
    } else {
      onSave(selectedList, '');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Save {selectedChannels.length} channel{selectedChannels.length > 1 ? 's' : ''} to list
          </h2>

          {existingLists.length > 0 && !isCreatingNew && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose existing list
              </label>
              <select
                value={selectedList || ''}
                onChange={(e) => setSelectedList(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a list</option>
                {existingLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isCreatingNew && (
            <button
              onClick={() => setIsCreatingNew(true)}
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-4"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create new list
            </button>
          )}

          {isCreatingNew && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New list name
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter list name"
              />
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedList && !newListName}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};