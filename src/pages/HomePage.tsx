import React from 'react';
import { Link } from 'react-router-dom';
import { Video, Users, FileText, MessageCircle, Brain, Download, MessageSquare, Image } from 'lucide-react';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  gradient: string;
}

const tools: Tool[] = [
  {
    id: 'video-search',
    title: 'Video Search',
    description: 'Search and filter YouTube videos with advanced criteria and batch actions.',
    icon: <Video className="w-6 h-6" />,
    path: '/videos',
    gradient: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'creator-search',
    title: 'Creator Search',
    description: 'Find and analyze YouTube creators based on niche, size, and engagement.',
    icon: <Users className="w-6 h-6" />,
    path: '/creators',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'chat',
    title: 'Chat with Video',
    description: 'Have an interactive AI conversation about any YouTube video content.',
    icon: <MessageSquare className="w-6 h-6" />,
    path: '/chat',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    id: 'transcript',
    title: 'Video Transcript',
    description: 'Extract and download complete transcripts from any YouTube video.',
    icon: <FileText className="w-6 h-6" />,
    path: '/transcript',
    gradient: 'from-orange-500 to-amber-500'
  },
  {
    id: 'comments',
    title: 'Comment Extractor',
    description: 'Download and analyze comments from videos or entire channels.',
    icon: <MessageCircle className="w-6 h-6" />,
    path: '/comments',
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    id: 'summary',
    title: 'Video Summary',
    description: 'Generate AI-powered summaries of YouTube videos in multiple formats.',
    icon: <Brain className="w-6 h-6" />,
    path: '/summary',
    gradient: 'from-violet-500 to-purple-500'
  },
  {
    id: 'download',
    title: 'Video Download',
    description: 'Download YouTube videos in your preferred quality and format.',
    icon: <Download className="w-6 h-6" />,
    path: '/download',
    gradient: 'from-red-500 to-pink-500'
  },
  {
    id: 'thumbnails',
    title: 'Thumbnail Downloader',
    description: 'Batch download thumbnails from any YouTube channel in high quality.',
    icon: <Image className="w-6 h-6" />,
    path: '/thumbnails',
    gradient: 'from-teal-500 to-emerald-500'
  }
];

export const HomePage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          YouTube Creator Tools
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A comprehensive suite of tools to help you analyze, extract, and manage YouTube content more effectively.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.path}
            className="group relative overflow-hidden bg-white rounded-lg shadow-sm border border-black/10 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${tool.gradient} text-white mb-4`}>
                {tool.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tool.title}
              </h3>
              <p className="text-gray-600">
                {tool.description}
              </p>
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-black rounded-lg transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
};