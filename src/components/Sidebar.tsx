import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Settings, Video, Users, FileText, Brain, Download, Home, List, MessageCircle, MessageSquare, Image } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60]"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-[100dvh] flex flex-col bg-white w-64 shadow-lg transform transition-transform duration-200 ease-in-out z-[70] border-r border-black/10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Core Features */}
          <NavLink
            to="/"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-[6px] transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/videos"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-[6px] transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Video className="w-5 h-5" />
            <span>Search Videos</span>
          </NavLink>

          <NavLink
            to="/creators"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-[6px] transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Users className="w-5 h-5" />
            <span>Find Creators</span>
          </NavLink>

          <NavLink
            to="/lists"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-[6px] transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <List className="w-5 h-5" />
            <span>My Lists</span>
          </NavLink>

          {/* Tools Section */}
          <div className="pt-6 pb-2">
            <div className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Tools
            </div>
          </div>

          <NavLink
            to="/transcript"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-[6px] transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <FileText className="w-5 h-5" />
            <span>Get Transcripts</span>
          </NavLink>

          <NavLink
            to="/comments"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-[6px] transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <MessageCircle className="w-5 h-5" />
            <span>Extract Comments</span>
          </NavLink>

          <NavLink
            to="/summary"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-[6px] transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Brain className="w-5 h-5" />
            <span>Summarize Video</span>
          </NavLink>

          <NavLink
            to="/chat"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-[6px] transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chat with Video</span>
          </NavLink>

          <NavLink
            to="/download"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-[6px] transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Download className="w-5 h-5" />
            <span>Download Video</span>
          </NavLink>

          <NavLink
            to="/thumbnails"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-[6px] transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Image className="w-5 h-5" />
            <span>Download Thumbnails</span>
          </NavLink>
        </nav>

        {/* Settings at Bottom */}
        <div className="p-4 border-t border-gray-200">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-[6px] transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </>
  );
};