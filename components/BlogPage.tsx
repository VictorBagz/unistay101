
import React, { useState } from 'react';
import { NewsItem } from '../types';
import Footer from './Footer';
import NewsDetailModal from './NewsDetailModal';
import { formatTimeAgo } from '../utils/dateUtils';

interface BlogPageProps {
  news: NewsItem[];
  onNavigateHome: () => void;
}

const BlogPage = ({ news, onNavigateHome }: BlogPageProps) => {
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const featuredPost = news.length > 0 ? news[0] : null;
    const otherPosts = news.length > 1 ? news.slice(1) : [];

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
                    <h1 className="text-3xl font-bold text-unistay-navy">UniStay Blog</h1>
                    <button onClick={onNavigateHome} className="font-semibold text-unistay-navy hover:text-unistay-yellow transition-colors flex items-center gap-2">
                        <i className="fas fa-arrow-left"></i>
                        Back to Home
                    </button>
                </div>
            </header>
            <main className="flex-grow max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full pt-24">
                {/* Featured Post */}
                {featuredPost && (
                    <section className="mb-12 group animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
                               <img src={featuredPost.imageUrl.replace('/100/100', '/600/400')} alt={featuredPost.title} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-unistay-yellow font-semibold mb-2">Featured Article</p>
                                <h2 className="text-4xl font-extrabold text-unistay-navy mb-4">{featuredPost.title}</h2>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                    <p>{formatTimeAgo(featuredPost.timestamp)}</p>
                                    <p>Source: {featuredPost.source}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedNews(featuredPost)}
                                    className="mt-6 bg-unistay-navy text-white font-bold py-3 px-8 rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105 flex items-center gap-2"
                                >
                                    Read Full Article <i className="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </section>
                )}
                
                {/* Other Posts */}
                <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <h3 className="text-2xl font-bold text-unistay-navy mb-6 border-b pb-2">Latest News</h3>
                    {otherPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {otherPosts.map((post, index) => (
                                 <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300 flex flex-col" style={{ animation: 'fade-in-up 0.5s ease-out forwards', animationDelay: `${index * 100}ms` }}>
                                    <img src={post.imageUrl.replace('/100/100', '/400/300')} alt={post.title} className="h-48 w-full object-cover"/>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h4 className="text-xl font-bold text-unistay-navy flex-grow group-hover:text-unistay-yellow transition-colors">{post.title}</h4>
                                        <div className="flex justify-between items-center mt-2 mb-4">
                                            <p className="text-xs text-gray-400">{formatTimeAgo(post.timestamp)}</p>
                                            <p className="text-xs text-gray-400">Source: {post.source}</p>
                                        </div>
                                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                                            <button 
                                                onClick={() => setSelectedNews(post)} 
                                                className="text-sm font-semibold text-unistay-yellow hover:text-unistay-navy transition-colors flex items-center gap-1"
                                            >
                                                Read More <i className="fas fa-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                 </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-12 bg-white rounded-lg shadow-md">
                            <i className="fas fa-newspaper text-4xl text-gray-300 mb-4"></i>
                            <h3 className="text-xl font-semibold text-unistay-navy">No More News</h3>
                            <p className="text-gray-500 mt-2">Check back later for more updates!</p>
                        </div>
                    )}
                </section>
            </main>
            
            {/* News Detail Modal */}
            <NewsDetailModal 
                news={selectedNews}
                onClose={() => setSelectedNews(null)}
            />
        </div>
    );
};

export default BlogPage;