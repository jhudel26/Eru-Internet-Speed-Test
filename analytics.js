// Vercel Analytics for static HTML
// Using vanilla JavaScript version since this is not a Next.js project
import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics
// This will automatically track page views and provide analytics
inject({
    mode: 'auto' // Automatically detects production/development
});

