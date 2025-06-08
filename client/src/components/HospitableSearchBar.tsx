import React, { useEffect, useRef } from 'react';

interface HospitableSearchBarProps {
  identifier?: string;
  type?: 'custom' | 'default';
  resultsUrl?: string;
  className?: string;
}

/**
 * A component that embeds the Hospitable search bar for navigation use
 */
const HospitableSearchBar: React.FC<HospitableSearchBarProps> = ({
  identifier = '3747e731-d69b-4c6e-93a9-d6a432b26db9',
  type = 'custom',
  resultsUrl = '/hospitable-search',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Check if the script is already loaded
    if (!document.querySelector('script[src="https://hospitable.b-cdn.net/direct-property-search-widget/hospitable-search-widget.prod.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://hospitable.b-cdn.net/direct-property-search-widget/hospitable-search-widget.prod.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        scriptLoaded.current = true;
        // Create widget after script loads
        createWidget();
      };
      
      document.head.appendChild(script);
      
      return () => {
        // Don't remove script as it might be used by other components
      };
    } else {
      // Script is already loaded
      scriptLoaded.current = true;
      createWidget();
    }
  }, [identifier, type, resultsUrl]);

  const createWidget = () => {
    if (!containerRef.current) return;
    
    // Clear previous content
    containerRef.current.innerHTML = '';
    
    // Create the hospitable element
    const widgetElement = document.createElement('hospitable-direct-mps');
    widgetElement.setAttribute('identifier', identifier);
    widgetElement.setAttribute('type', type);
    widgetElement.setAttribute('results-url', resultsUrl);
    
    // Append to container
    containerRef.current.appendChild(widgetElement);
  };

  return (
    <div 
      ref={containerRef} 
      className={`hospitable-search-bar-container ${className}`}
      aria-label="Search properties"
    />
  );
};

export default HospitableSearchBar;