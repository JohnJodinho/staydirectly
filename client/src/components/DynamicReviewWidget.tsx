import React, { useEffect, useState } from 'react';
import ReviewFallback from './ReviewFallback';

interface Props {
  embedCode?: string; // This is property.reviewWidgetCode
  className?: string;
}

const DynamicReviewWidget: React.FC<Props> = ({ embedCode, className = "" }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!embedCode) return;

    // Dynamically create a container and inject HTML
    const container = document.getElementById('dynamic-review-widget');
    if (container) {
      container.innerHTML = embedCode;

      
      const timeout = setTimeout(() => {
        const widgetLoaded = container.querySelector('.ry-widget');
        if (!widgetLoaded) {
          setHasError(true);
        }
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [embedCode]);

  if (!embedCode || hasError) {
    return <ReviewFallback className={className} />;
  }

  return <div id="dynamic-review-widget" className={className} />;
};

export default DynamicReviewWidget;
