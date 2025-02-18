import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-40 border-b border-black/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-[6px] hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold">Represent</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};