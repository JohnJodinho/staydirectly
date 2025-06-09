import React, { useEffect, useState } from 'react';
import '../lib/revyoos.css';
import ReviewFallback from './ReviewFallback';

interface RevyoosDirectEmbedProps {
  propertyId?: string; // Not used in this implementation
  className?: string;
}

/**
 * RevyoosDirectEmbed uses a direct script tag approach for embedding the Revyoos widget
 * This exactly matches the implementation requested by the user
 */
const RevyoosDirectEmbed: React.FC<RevyoosDirectEmbedProps> = ({ 
  className = "w-full h-auto min-h-[600px]" 
}) => {
  const [isRevyoosLoaded, setIsRevyoosLoaded] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    // Remove any existing unwanted widget
    const removeUnwantedWidget = () => {
      const unwantedWidget = document.querySelector('[id^="scp_iframe_general_"]');
      if (unwantedWidget) {
        unwantedWidget.remove();
      }
    };

    // Clear any old script
    const existingScript = document.querySelector('script[data-revyoos-widget]');
    if (existingScript) {
      existingScript.remove();
    }

    // Inject the Revyoos script
    const script = document.createElement('script');
    script.defer = true;
    script.type = 'application/javascript';
    script.src = 'https://www.revyoos.com/js/widgetBuilder.js';
    script.setAttribute('data-revyoos-widget', 'eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVjIn0=');
    document.head.appendChild(script);

    // Widget detection and retry logic
    const checkRevyoosWidget = () => {
      const revyoosWidget = document.querySelector('.revyoos-embed-widget .ry-widget');
      if (revyoosWidget) {
        setIsRevyoosLoaded(true);
      } else if (loadAttempts < 5) {
        setLoadAttempts(prev => prev + 1);
        setTimeout(checkRevyoosWidget, 2000);
      } else {
        setUseFallback(true);
      }
    };

    // Start checking for widget
    const widgetCheckTimeout = setTimeout(checkRevyoosWidget, 2000);

    // Repeatedly check and remove unwanted widget
    const unwantedWidgetInterval = setInterval(() => {
      removeUnwantedWidget();
    }, 1000); // Every second

    // Cleanup on unmount
    return () => {
      clearTimeout(widgetCheckTimeout);
      clearInterval(unwantedWidgetInterval);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [loadAttempts]);

  
  return (
    <div id="revyoos-container" className={className}>
      {/* This div will be targeted by the Revyoos script */}
      <div 
        className="revyoos-embed-widget" 
        data-revyoos-embed='eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVjIn0=' 
        style={{ opacity: isRevyoosLoaded ? 1 : 0 }}
      />
      
      {/* Show fallback component if Revyoos hasn't loaded after attempts */}
      {useFallback && !isRevyoosLoaded && (
        <ReviewFallback className="fade-in" />
      )}
      
      {/* Show loading indicator while waiting for Revyoos */}
      {!isRevyoosLoaded && !useFallback && (
        <div className="w-full flex flex-col items-center justify-center py-12 fade-in">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full loader-spin mb-4"></div>
          <p className="text-gray-500">Loading reviews...</p>
        </div>
      )}
    </div>
  );
};

export default RevyoosDirectEmbed;