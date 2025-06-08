import { storage } from './storage-factory';
import { Router } from 'express';
import { SitemapStream, streamToPromise } from 'sitemap';
import { createGzip } from 'zlib';

let sitemap: Buffer;

export function setupSitemapRoutes(router: Router) {
  router.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.header('Content-Encoding', 'gzip');

    // If we have a cached sitemap and it's less than an hour old, serve that
    if (sitemap) {
      res.send(sitemap);
      return;
    }

    try {
      // Create a new sitemap stream
      const smStream = new SitemapStream({ hostname: 'https://staydirectly.com' });
      const pipeline = smStream.pipe(createGzip());

      // Add static routes
      smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
      smStream.write({ url: '/search', changefreq: 'daily', priority: 0.9 });
      smStream.write({ url: '/about', changefreq: 'monthly', priority: 0.7 });
      smStream.write({ url: '/contact', changefreq: 'monthly', priority: 0.7 });

      // Add dynamic routes for properties
      const properties = await storage.getProperties(1000); // Get all properties (limit 1000)
      properties.forEach(property => {
        smStream.write({
          url: `/property/${property.id}`,
          lastmod: property.updatedAt ? new Date(property.updatedAt).toISOString() : undefined,
          changefreq: 'weekly',
          priority: 0.8,
          // Add image entries for property images
          img: property.imageUrl ? [{
            url: property.imageUrl,
            caption: property.name,
            title: property.name
          }] : undefined
        });
      });

      // Add dynamic routes for cities
      const cities = await storage.getCities(100); // Get all cities (limit 100)
      cities.forEach(city => {
        smStream.write({
          url: `/city/${city.name.toLowerCase().replace(/\s+/g, '-')}`,
          lastmod: city.updatedAt ? new Date(city.updatedAt).toISOString() : undefined,
          changefreq: 'weekly',
          priority: 0.7,
          // Add image entries for city images
          img: city.imageUrl ? [{
            url: city.imageUrl,
            caption: `${city.name}, ${city.country}`,
            title: `${city.name}, ${city.country}`
          }] : undefined
        });
      });

      // Mark the end of the stream
      smStream.end();

      // Cache the result
      const sitemapData = await streamToPromise(pipeline);
      sitemap = sitemapData;

      // Send the response
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).end();
    }
  });
}