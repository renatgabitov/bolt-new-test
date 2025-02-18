import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { VideoSearchPage } from './pages/VideoSearchPage';
import { ListsPage } from './pages/ListsPage';
import { SettingsPage } from './pages/SettingsPage';
import TranscriptPage from './pages/TranscriptPage';
import SummaryPage from './pages/SummaryPage';
import ChatPage from './pages/ChatPage';
import { DownloadPage } from './pages/DownloadPage';
import { CommentsPage } from './pages/CommentsPage';
import { ThumbnailDownloaderPage } from './pages/ThumbnailDownloaderPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-[#fdfbf5]">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex pt-16">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/creators" element={<SearchPage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/transcript" element={<TranscriptPage />} />
              <Route path="/summary" element={<SummaryPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/download" element={<DownloadPage />} />
              <Route path="/comments" element={<CommentsPage />} />
              <Route path="/videos" element={<VideoSearchPage />} />
              <Route path="/thumbnails" element={<ThumbnailDownloaderPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App