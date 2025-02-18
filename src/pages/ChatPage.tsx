import React, { useState } from 'react';
import { MessageSquare, Send, AlertCircle, Loader2, Link as LinkIcon, Bot } from 'lucide-react';
import { VideoDetails } from '../components/VideoDetails';
import { CollapsibleTranscript } from '../components/CollapsibleTranscript';
import { logger } from '../lib/logger';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatMessage extends Message {
  id: string;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStreamedResponse, setCurrentStreamedResponse] = useState('');

  const extractVideoId = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;

    try {
      const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|attribution_link\?.*?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(regex);
      
      if (!match) return null;
      
      const videoId = match[1];
      if (videoId.length !== 11) return null;
      
      return videoId;
    } catch (err) {
      console.error('Error extracting video ID:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const extractedVideoId = extractVideoId(videoUrl);
    if (!extractedVideoId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
      return;
    }

    setVideoId(extractedVideoId);
    setIsLoadingVideo(true);

    try {
      const videoResponse = await fetch(
        `/youtube/video?videoID=${extractedVideoId}`
      );
      const videoData = await videoResponse.json();

      if (!videoResponse.ok) {
        throw new Error(videoData.error || 'Failed to fetch video details');
      }

      setVideoDetails(videoData);
      
      const systemMessage: Message = {
        role: 'system',
        content: `You are a helpful assistant discussing the YouTube video "${videoData.snippet.title}". Use the video's content to provide accurate and relevant responses.`
      };

      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hi! I'm ready to discuss the video "${videoData.snippet.title}". What would you like to know about it?`,
        timestamp: new Date()
      };

      setChatHistory([systemMessage]);
      setMessages([welcomeMessage]);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch video information');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: currentMessage
    };

    const userChatMessage: ChatMessage = {
      ...userMessage,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userChatMessage]);
    setCurrentMessage('');
    setIsProcessing(true);
    setCurrentStreamedResponse('');

    try {
      const response = await fetch(`/ai/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data === '[DONE]') continue;
            accumulatedResponse += data;
            setCurrentStreamedResponse(accumulatedResponse);
          }
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: accumulatedResponse
      };

      const assistantChatMessage: ChatMessage = {
        ...assistantMessage,
        id: Date.now().toString(),
        timestamp: new Date()
      };

      setChatHistory([...chatHistory, userMessage, assistantMessage]);
      setMessages(prev => [...prev, assistantChatMessage]);
    } catch (err) {
      logger.error('Chat error:', err);
      setError('Failed to process your message. Please try again.');
    } finally {
      setIsProcessing(false);
      setCurrentStreamedResponse('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chat with YouTube Video
        </h1>
        <p className="text-gray-600">
          Have an interactive conversation about any YouTube video using AI.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-1">
              Video URL
            </label>
            <div className="relative">
              <input
                id="video-url"
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="search-input pl-10"
              />
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoadingVideo || !videoUrl.trim()}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {isLoadingVideo ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5" />
                <span>Start Chat</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[6px]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 break-words">{error}</p>
          </div>
        </div>
      )}

      {videoId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {videoDetails && (
              <>
                <VideoDetails
                  videoId={videoId}
                  videoDetails={videoDetails}
                  isLoading={isLoadingVideo}
                />
                <CollapsibleTranscript
                  videoId={videoId}
                  videoTitle={videoDetails.snippet.title}
                  channelTitle={videoDetails.snippet.channelTitle}
                />
              </>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-4 border-b border-black/10">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-medium text-gray-900">
                    AI Chat Assistant
                  </h2>
                </div>
              </div>

              <div className="flex flex-col h-[600px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-75 mt-1 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                        {currentStreamedResponse ? (
                          <p className="text-sm text-gray-900">{currentStreamedResponse}</p>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm text-gray-500">Thinking...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-black/10">
                  <form onSubmit={handleSendMessage} className="flex space-x-4">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Ask anything about the video..."
                      className="flex-1 input"
                      disabled={!videoId || isProcessing}
                    />
                    <button
                      type="submit"
                      disabled={!currentMessage.trim() || !videoId || isProcessing}
                      className="btn-primary px-6"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;