// Vercel Analytics for static HTML
// Using CDN version since this is not a Node.js/Next.js project

// Load Vercel Analytics via CDN
(function() {
    // Create script element for Vercel Analytics
    const script = document.createElement('script');
    script.src = 'https://cdn.vercel-insights.com/v1/script.js';
    script.defer = true;
    
    // Set the script ID for Vercel Analytics
    script.id = 'vercel-analytics';
    
    // Add to document head
    document.head.appendChild(script);
    
    // Alternative: Use window.va for manual tracking if needed
    window.va = function() {
        // Vercel Analytics will be available once the script loads
        (window.vaq = window.vaq || []).push(arguments);
    };
})();

