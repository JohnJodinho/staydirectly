import React, { useEffect, useRef } from 'react';

interface HospitableSearchWidgetProps {
  identifier: string;
  type?: 'custom' | 'default';
  className?: string;
}

/**
 * A component that embeds the Hospitable Direct property search widget
 */
const HospitableSearchWidget: React.FC<HospitableSearchWidgetProps> = ({
  identifier,
  type = 'default',
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
  }, [identifier, type]);

  const createWidget = () => {
    if (!containerRef.current) return;
    
    // Clear previous content
    containerRef.current.innerHTML = '';
    
    // Create the hospitable element
    const widgetElement = document.createElement('hospitable-direct-pps');
    widgetElement.setAttribute('identifier', identifier);
    widgetElement.setAttribute('type', type);
    
    // Append to container
    containerRef.current.appendChild(widgetElement);
  };

  return (
    <div 
      ref={containerRef} 
      className={`hospitable-search-widget-container ${className}`}
      aria-label="Property search widget"
    />
  );
};

export default HospitableSearchWidget;