import React, { useState } from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const formatText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <div key={i} className="min-h-[1.2em]">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="text-gold-accent font-semibold">{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
      </div>
    );
  });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isZoomed, setIsZoomed] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!message.generatedImage) return;
    const link = document.createElement('a');
    link.href = message.generatedImage;
    link.download = `nano-banana-pro-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-sm ${
            isUser
              ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-tr-sm border border-gray-600'
              : 'bg-gradient-to-br from-studio-gray to-[#252525] text-gray-200 rounded-tl-sm border border-gray-800'
          }`}
        >
          {/* 1. Display Reference Images (User Uploaded) */}
          {message.images && message.images.length > 0 && (
            <div className={`mb-4 grid gap-2 ${message.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {message.images.map((img, idx) => (
                <img 
                  key={idx}
                  src={img} 
                  alt={`Reference ${idx + 1}`} 
                  className="rounded-lg border border-gray-600 object-cover w-full h-32 md:h-48" 
                />
              ))}
            </div>
          )}
          
          {/* 2. Message Content */}
          <div className="leading-relaxed tracking-wide text-sm md:text-base font-light mb-2">
            {formatText(message.content)}
          </div>

          {/* 3. Generated Image (Model Output) */}
          {message.generatedImage && (
            <div className="mt-4 relative group rounded-lg overflow-hidden border border-gray-700 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-accent to-yellow-600 z-10"></div>
                <img 
                    src={message.generatedImage} 
                    alt="AI Generated Result" 
                    className="w-full h-auto object-cover cursor-zoom-in transition-transform duration-700 hover:scale-[1.01]"
                    onClick={() => setIsZoomed(true)}
                />
                
                {/* Overlay Controls */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                        onClick={() => setIsZoomed(true)}
                        className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur border border-white/10 shadow-lg"
                        title="放大預覽"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                        </svg>
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur border border-white/10 shadow-lg"
                        title="下載圖片"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                    </button>
                </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-3 text-right uppercase tracking-wider flex justify-end items-center gap-2">
             {message.generatedImage && <span className="text-gold-accent/70 text-[10px]">High-Res Output</span>}
             <span>{isUser ? '客戶 (Client)' : 'AI 導演 (Director)'}</span>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {isZoomed && message.generatedImage && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in"
            onClick={() => setIsZoomed(false)}
        >
            <div className="absolute top-6 right-6 z-50">
                <button className="text-white hover:text-gold-accent transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <img 
                src={message.generatedImage} 
                alt="Full Screen Result" 
                className="max-w-[95vw] max-h-[95vh] object-contain rounded shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
            />
            
            <div className="absolute bottom-10 flex gap-4">
                <button 
                    onClick={handleDownload}
                    className="px-6 py-3 bg-gold-accent hover:bg-gold-hover text-black font-semibold rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    下載原始檔
                </button>
            </div>
        </div>
      )}
    </>
  );
};

export default ChatMessage;