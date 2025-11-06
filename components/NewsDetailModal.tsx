import React, { useEffect, useCallback } from 'react';
import { NewsItem } from '../types';
import { formatTimeAgo } from '../utils/dateUtils';

interface NewsDetailModalProps {
    news: NewsItem | null;
    onClose: () => void;
}

const NewsDetailModal = ({ news, onClose }: NewsDetailModalProps) => {
    const handleEscape = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [handleEscape]);

    const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp') => {
        if (!news) return;

        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(news.title);
        
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
            whatsapp: `https://api.whatsapp.com/send?text=${title}%20${url}`
        };

        window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
    };

    if (!news) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-up">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close modal"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>

                {/* Image */}
                <div className="w-full h-64 sm:h-80 relative">
                    <img 
                        src={news.imageUrl.replace('/100/100', '/800/600')} 
                        alt={news.title} 
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                        <p>{news.timestamp ? formatTimeAgo(news.timestamp) : 'Recently posted'}</p>
                        <p>Source: {news.source}</p>
                    </div>
                    <h2 className="text-3xl font-bold text-unistay-navy mb-6">{news.title}</h2>
                    <div className="prose max-w-none">
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {news.description}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Share this article:
                                </p>
                                <div className="flex gap-4 mt-2">
                                    <button 
                                        onClick={() => handleShare('twitter')}
                                        className="text-gray-600 hover:text-[#1DA1F2] transition-colors"
                                        aria-label="Share on Twitter"
                                    >
                                        <i className="fab fa-twitter"></i>
                                    </button>
                                    <button 
                                        onClick={() => handleShare('facebook')}
                                        className="text-gray-600 hover:text-[#4267B2] transition-colors"
                                        aria-label="Share on Facebook"
                                    >
                                        <i className="fab fa-facebook"></i>
                                    </button>
                                    <button 
                                        onClick={() => handleShare('linkedin')}
                                        className="text-gray-600 hover:text-[#0077b5] transition-colors"
                                        aria-label="Share on LinkedIn"
                                    >
                                        <i className="fab fa-linkedin"></i>
                                    </button>
                                    <button 
                                        onClick={() => handleShare('whatsapp')}
                                        className="text-gray-600 hover:text-[#25D366] transition-colors"
                                        aria-label="Share on WhatsApp"
                                    >
                                        <i className="fab fa-whatsapp"></i>
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                                aria-label="Close modal"
                            >
                                <i className="fas fa-times"></i>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsDetailModal;