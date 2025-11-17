/**
 * Utility functions for managing Open Graph meta tags
 * This allows articles to display proper previews when shared on social media
 */

export const setArticleMetaTags = (article: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    source: string;
}) => {
    // Remove any existing Open Graph tags to avoid duplicates
    const existingTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
    existingTags.forEach(tag => {
        if (tag.getAttribute('property') !== 'og:type' || 
            tag.getAttribute('name') !== 'twitter:card') {
            tag.remove();
        }
    });

    // Image URL with larger dimensions for better preview
    const imageUrl = article.imageUrl.replace('/100/100', '/800/600');
    
    // Set Open Graph meta tags for social media sharing
    const metaTags = [
        { property: 'og:title', content: article.title },
        { property: 'og:description', content: article.title },
        { property: 'og:image', content: imageUrl },
        { property: 'og:image:width', content: '800' },
        { property: 'og:image:height', content: '600' },
        { property: 'og:image:alt', content: article.title },
        { property: 'og:url', content: `${window.location.origin}?view=newsArticle&articleId=${article.id}` },
        { property: 'og:type', content: 'article' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: article.title },
        { name: 'twitter:description', content: article.title },
        { name: 'twitter:image', content: imageUrl },
    ];

    // Add or update meta tags
    metaTags.forEach(({ property, name, content }) => {
        let element = document.querySelector(
            property ? `meta[property="${property}"]` : `meta[name="${name}"]`
        );
        
        if (!element) {
            element = document.createElement('meta');
            if (property) {
                element.setAttribute('property', property);
            } else {
                element.setAttribute('name', name!);
            }
            document.head.appendChild(element);
        }
        
        element.setAttribute('content', content);
    });

    // Set page title
    document.title = `${article.title} - UniStay`;
};

export const resetMetaTags = () => {
    // Reset to default meta tags
    document.title = 'UniStay - Find Your Perfect Student Home';
    
    const metaTags = [
        { property: 'og:title', content: 'UniStay - Find Your Perfect Student Home' },
        { property: 'og:description', content: 'Find your perfect student accommodation at UniStay' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
    ];

    metaTags.forEach(({ property, name, content }) => {
        let element = document.querySelector(
            property ? `meta[property="${property}"]` : `meta[name="${name}"]`
        );
        
        if (!element) {
            element = document.createElement('meta');
            if (property) {
                element.setAttribute('property', property);
            } else {
                element.setAttribute('name', name!);
            }
            document.head.appendChild(element);
        }
        
        element.setAttribute('content', content);
    });
};
