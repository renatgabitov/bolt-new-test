import React from 'react';
import { User, Settings } from 'lucide-react';
import { logger } from '../lib/logger';

export const SettingsPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-medium text-gray-900">Application Settings</h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600">Settings will be available soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};