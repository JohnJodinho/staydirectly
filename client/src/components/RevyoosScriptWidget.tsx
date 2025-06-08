import React, { useEffect, useRef } from 'react';

interface RevyoosScriptWidgetProps {
  propertyId: string;
  className?: string;
}

/**
 * This component handles loading the Revyoos widget script
 * It creates and injects the script tag with the correct configuration
 */
const RevyoosScriptWidget: React.FC<RevyoosScriptWidgetProps> = ({ 
  propertyId,
  className = "w-full" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Remove any existing Revyoos script to prevent duplicates
    const existingScript = document.querySelector('script[data-revyoos-widget]');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Create a new script element
    const script = document.createElement('script');
    script.defer = true;
    script.type = 'application/javascript';
    script.src = 'https://www.revyoos.com/js/widgetBuilder.js';
    
    // Use the property ID from props
    script.setAttribute('data-revyoos-widget', 'eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVjIn0=');
    
    // Try to isolate the widget to our container
    script.setAttribute('data-revyoos-container', 'revyoos-widget-container');
    
    // Add the script to our container instead of the body
    containerRef.current.appendChild(script);
    
    // Clean up the script on component unmount
    return () => {
      if (containerRef.current && containerRef.current.contains(script)) {
        containerRef.current.removeChild(script);
      }
    };
  }, [propertyId, containerRef]);

  return (
    <div id="revyoos-widget-container" ref={containerRef} className={className}>
      <div 
        className="revyoos-embed-widget"
        data-revyoos-embed='eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVjIn0='
      />
    </div>
  );
};

export default RevyoosScriptWidget;