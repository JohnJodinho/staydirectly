import React, { useEffect, useRef, useState } from 'react';
import '../lib/revyoos.css';
import ReviewFallback from './ReviewFallback';
import { useToast } from '@/hooks/use-toast';

interface RevyoosDirectEmbedProps {
  reviewWidgetCode?: string;
  className?: string;
}

/**
 * Injects Revyoos review widget precisely where rendered.
 * Prevents unwanted space until widget fully loads.
 * Fallback reviews shown if widget fails after retries.
 */
const RevyoosDirectEmbed: React.FC<RevyoosDirectEmbedProps> = ({
  reviewWidgetCode,
  className = "w-full h-auto min-h-[600px]"
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!reviewWidgetCode || !containerRef.current) return;

    setIsLoaded(false); // Reset state

    const container = containerRef.current;

    // Clear previous content (important for client-side routing)
    container.innerHTML = '';

    // Create Revyoos target div
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'revyoos-embed-widget';
    widgetDiv.setAttribute('data-revyoos-embed', reviewWidgetCode);
    widgetDiv.style.display = 'none'; // Hide until widget fully loads
    container.appendChild(widgetDiv);

    // Inject Revyoos script
    const script = document.createElement('script');
    script.src = 'https://www.revyoos.com/js/widgetBuilder.js';
    script.defer = true;
    script.type = 'application/javascript';
    script.setAttribute('data-revyoos-widget', reviewWidgetCode);
    container.appendChild(script);

    let attempts = 0;
    const maxAttempts = 5;

    const checkWidget = () => {
      const widget = container.querySelector('.ry-widget');
      if (widget) {
        widgetDiv.style.display = 'block'; // Show widget container
        setIsLoaded(true);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkWidget, 2000);
      }
      // } else {
      //   toast({
      //     title: 'Reviews Widget Failed to Load',
      //     description: 'We could not load the Revyoos review widget after multiple attempts. Showing fallback reviews instead.',
      //     variant: 'destructive',
      //     duration: 5000,
      //   });
      // }
    };

    const widgetCheckTimeout = setTimeout(checkWidget, 2000);

    return () => {
      clearTimeout(widgetCheckTimeout);
      container.innerHTML = '';
    };
  }, [reviewWidgetCode, toast]);

  if (!reviewWidgetCode) return <ReviewFallback className={className} />;

  return (
    <div ref={containerRef} className={className + " relative"}>
      {!isLoaded && (
        <div className="w-full flex flex-col items-center justify-center py-12 fade-in">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full loader-spin mb-4"></div>
          <p className="text-gray-500">Loading reviews...</p>
        </div>
      )}

      {!isLoaded && (
        <ReviewFallback className="fade-in mt-4" />
      )}
    </div>
  );
};

export default RevyoosDirectEmbed;
