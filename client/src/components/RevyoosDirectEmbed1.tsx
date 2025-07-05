import React, { useEffect, useState } from 'react';
import '../lib/revyoos.css';
import ReviewFallback from './ReviewFallback';
import { useToast } from '@/hooks/use-toast';

interface RevyoosDirectEmbedProps {
  reviewWidgetCode?: string;
  className?: string;
}

const RevyoosDirectEmbed: React.FC<RevyoosDirectEmbedProps> = ({
  reviewWidgetCode,
  className = "w-full h-auto min-h-[600px]"
}) => {
  const [isRevyoosLoaded, setIsRevyoosLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!reviewWidgetCode) return;

    setIsRevyoosLoaded(false);
    setRetryCount(0);

    const removeUnwantedWidget = () => {
      const unwantedWidget = document.querySelector('[id^="scp_iframe_general_"]');
      if (unwantedWidget) unwantedWidget.remove();
    };

    document.querySelectorAll('script[data-revyoos-widget]').forEach(s => s.remove());

    const script = document.createElement('script');
    script.defer = true;
    script.type = 'application/javascript';
    script.src = 'https://www.revyoos.com/js/widgetBuilder.js';
    script.setAttribute('data-revyoos-widget', reviewWidgetCode);
    document.body.appendChild(script);

    const maxRetries = 5;
    let attempts = 0;

    const checkWidgetLoaded = () => {
      const widget = document.querySelector('.revyoos-embed-widget .ry-widget');
      if (widget) {
        setIsRevyoosLoaded(true);
      } else if (attempts < maxRetries) {
        attempts++;
        setTimeout(checkWidgetLoaded, 2000);
      } else {
        toast({
          title: 'Reviews Widget Failed to Load',
          description: 'We could not load the Revyoos review widget after multiple attempts. Showing fallback reviews instead.',
          variant: 'destructive',
          duration: 5000,
        });
      }
    };

    const widgetCheckTimeout = setTimeout(checkWidgetLoaded, 2000);
    const unwantedInterval = setInterval(removeUnwantedWidget, 1000);

    return () => {
      clearTimeout(widgetCheckTimeout);
      clearInterval(unwantedInterval);
      if (script.parentNode) script.remove();
    };
  }, [reviewWidgetCode, toast]);

  if (!reviewWidgetCode) return <ReviewFallback className={className} />;

  return (
    <div id="revyoos-container" className={className}>
      <div
        className="revyoos-embed-widget"
        data-revyoos-embed={reviewWidgetCode}
        style={{ opacity: isRevyoosLoaded ? 1 : 0 }}
      />

      {!isRevyoosLoaded && (
        <div className="w-full flex flex-col items-center justify-center py-12 fade-in">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full loader-spin mb-4"></div>
          <p className="text-gray-500">Loading reviews...</p>
        </div>
      )}

      {!isRevyoosLoaded && retryCount >= 5 && (
        <ReviewFallback className="fade-in" />
      )}
    </div>
  );
};

export default RevyoosDirectEmbed;
