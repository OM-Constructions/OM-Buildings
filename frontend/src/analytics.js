/**
 * Vercel Web Analytics Integration
 * Injects analytics tracking for the OM Buildings website
 * 
 * This module dynamically loads and initializes Vercel Web Analytics
 * from the CDN and injects the tracking script.
 */

// Import inject function from @vercel/analytics via CDN
import { inject } from 'https://cdn.jsdelivr.net/npm/@vercel/analytics@1/+esm';

// Initialize Vercel Analytics
// This will automatically track page views and web vitals
inject();
