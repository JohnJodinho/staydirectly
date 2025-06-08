import React from 'react';
import { Helmet } from 'react-helmet-async';

interface MetaProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string;
}

/**
 * Meta component for setting page metadata
 */
export const Meta: React.FC<MetaProps> = ({ 
  title, 
  description, 
  canonical, 
  image, 
  type = 'website',
  keywords
}) => {
  const siteTitle = 'StayDirectly';
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;
  const defaultImage = '/default-og-image.jpg'; // Default image path
  
  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={`https://staydirectly.com${canonical}`} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {canonical && <meta property="og:url" content={`https://staydirectly.com${canonical}`} />}
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content="StayDirectly" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
};

interface PropertyStructuredDataProps {
  name: string;
  description: string;
  image: string;
  price: number;
  ratingValue: number;
  reviewCount: number;
  address: string;
}

/**
 * Structured data component for property listings
 */
export const PropertyStructuredData: React.FC<PropertyStructuredDataProps> = ({ 
  name, 
  description, 
  image, 
  price, 
  ratingValue, 
  reviewCount, 
  address 
}) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": name,
    "description": description,
    "image": image,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": address
    },
    "priceRange": `$${price} per night`,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": ratingValue,
      "reviewCount": reviewCount
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

interface CityStructuredDataProps {
  name: string;
  description: string;
  image: string;
  country: string;
  region: string;
  propertyCount: number;
}

/**
 * Structured data component for city pages
 */
export const CityStructuredData: React.FC<CityStructuredDataProps> = ({ 
  name, 
  description, 
  image, 
  country,
  region,
  propertyCount
}) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": name,
    "description": description,
    "image": image,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": name,
      "addressRegion": region,
      "addressCountry": country
    },
    "geo": {
      "@type": "GeoCoordinates"
      // Latitude and longitude would be added if available in the data
    },
    "additionalProperty": {
      "@type": "PropertyValue",
      "name": "Vacation Rentals",
      "value": `${propertyCount} properties available`
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

interface SearchResultsStructuredDataProps {
  query: string;
  resultCount: number;
  properties: Array<{
    name: string;
    url: string;
    image: string;
    price: number;
    description: string;
    location: string;
  }>;
}

/**
 * Structured data component for search results
 */
export const SearchResultsStructuredData: React.FC<SearchResultsStructuredDataProps> = ({
  query,
  resultCount,
  properties
}) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": resultCount,
    "itemListElement": properties.map((property, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Accommodation",
        "name": property.name,
        "description": property.description,
        "image": property.image,
        "url": `https://staydirectly.com${property.url}`,
        "offers": {
          "@type": "Offer",
          "price": property.price,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        },
        "address": {
          "@type": "PostalAddress",
          "streetAddress": property.location
        }
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};