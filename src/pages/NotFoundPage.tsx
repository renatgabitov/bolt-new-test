import React from 'react';
import { Link } from 'react-router-dom';
import { Ghost, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <Ghost className="w-24 h-24 text-gray-400 mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
        Oops! Page Not Found
      </h1>
      <p className="text-xl text-gray-600 mb-8 text-center max-w-md">
        Looks like this page took a coffee break and forgot to come back! ☕️
      </p>
      <Link
        to="/"
        className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-[6px] font-medium hover:bg-gray-900 transition-colors"
      >
        <Home className="w-5 h-5" />
        <span>Back to Home</span>
      </Link>
    </div>
  );
};