import React, { useState, useEffect } from 'react';
import { GeneratedImageResult } from '../types';

interface ImageGalleryProps {
  results: GeneratedImageResult[];
  onEditImage: (image: string, instruction: string) => Promise<void>;
  isEditing: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ results, onEditImage, isEditing }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showEditInput, setShowEditInput] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');

  // Always jump to the newest image when results change
  useEffect(() => {
    if (results.length > 0) {
      setCurrentIndex(results.length - 1);
    }
  }, [results.length]);

  if (results.length === 0) return null;

  const currentResult = results[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    setShowEditInput(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    setShowEditInput(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentResult.imageUrl;
    link.download = `nano-banana-pro-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitEdit = async () => {
    if (!editInstruction.trim()) return;
    await onEditImage(currentResult.imageUrl, editInstruction);
    setEditInstruction('');
    setShowEditInput(false);
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      {/* Main Image Container */}
      <div className="relative group max-w-2xl w-full mb-4">
        <div className="absolute -inset-1 bg-gradient-to-r from-gold-accent to-yellow-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative p-1 bg-black rounded-lg overflow-hidden">
          <div className="relative">
             <img 
                src={currentResult.imageUrl} 
                alt="Generated Result" 
                className="w-full rounded shadow-2xl cursor-zoom-in"
                onClick={() => setIsZoomed(true)}
             />
             
             {/* Overlay Toolbar */}
             <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => setIsZoomed(true)}
                    className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur border border-white/10"
                    title="放大預覽"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                    </svg>
                </button>
                <button 
                    onClick={handleDownload}
                    className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur border border-white/10"
                    title="下載圖片"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                </button>
                <button 
                    onClick={() => setShowEditInput(!showEditInput)}
                    className={`p-2 rounded-full backdrop-blur border border-white/10 transition-colors ${showEditInput ? 'bg-gold-accent text-black' : 'bg-black/60 hover:bg-black/80 text-white'}`}
                    title="後製編修"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l2.846-.813a1.125 1.125 0 00.463-.263l10.334-10.334a1.125 1.125 0 000-1.591l-2.845-2.845a1.125 1.125 0 00-1.591 0L7.545 11.115a1.125 1.125 0 00-.263.463z" />
                         <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l3.75 3.75" />
                    </svg>
                </button>
             </div>
          </div>
        </div>

        {/* Navigation Dots / Arrows */}
        {results.length > 1 && (
            <div className="flex justify-between items-center mt-4 px-2">
                <button 
                    onClick={handlePrev} 
                    disabled={currentIndex === 0}
                    className="text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <span className="text-xs font-mono text-gray-400">
                    {currentIndex + 1} / {results.length}
                </span>
                <button 
                    onClick={handleNext} 
                    disabled={currentIndex === results.length - 1}
                    className="text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        )}
      </div>

      {/* Inline Edit Input */}
      {showEditInput && (
        <div className="w-full max-w-2xl bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 mb-6 shadow-xl animate-slide-down">
            <h4 className="text-xs text-gold-accent font-bold uppercase mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                </svg>
                AI 後製修圖 (Post-Processing)
            </h4>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={editInstruction}
                    onChange={(e) => setEditInstruction(e.target.value)}
                    placeholder="例如：請將背景改為夜晚城市，或為商品增加光澤感..."
                    className="flex-1 bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-gold-accent focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitEdit()}
                    disabled={isEditing}
                />
                <button 
                    onClick={handleSubmitEdit}
                    disabled={isEditing || !editInstruction.trim()}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded border border-gray-600 transition-colors disabled:opacity-50"
                >
                    {isEditing ? '處理中...' : '執行'}
                </button>
            </div>
        </div>
      )}

      {/* Prompt Display */}
      <div className="w-full max-w-2xl mt-2 p-4 bg-gray-900/80 rounded border border-gray-800 backdrop-blur mb-12">
        <p className="text-xs text-gold-accent font-bold uppercase mb-2">生成紀錄 (Prompt Log)</p>
        <p className="text-sm text-gray-400 font-mono leading-relaxed break-words">{currentResult.prompt}</p>
      </div>

      {/* Zoom Modal (Lightbox) */}
      {isZoomed && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in"
            onClick={() => setIsZoomed(false)}
        >
            <div className="absolute top-6 right-6 z-50">
                <button className="text-white hover:text-gold-accent transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <img 
                src={currentResult.imageUrl} 
                alt="Full Screen Result" 
                className="max-w-[95vw] max-h-[95vh] object-contain rounded shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
            />
            
            <div className="absolute bottom-6 flex gap-4">
                <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                    className="px-6 py-2 bg-gold-accent hover:bg-gold-hover text-black font-semibold rounded-full shadow-lg transition-transform hover:scale-105"
                >
                    下載原始檔
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
