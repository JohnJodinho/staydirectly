import React, { useEffect } from 'react';

interface RevyoosScriptLoaderProps {
  widgetCode: string;
}

/**
 * This component handles loading the Revyoos widget script
 * It creates and injects the script tag with the correct configuration
 */
const RevyoosScriptLoader: React.FC<RevyoosScriptLoaderProps> = ({ widgetCode }) => {
  useEffect(() => {
    // First remove any existing script to avoid duplicates
    const existingScript = document.querySelector('script[data-revyoos-widget]');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Create the script element
    const script = document.createElement('script');
    script.defer = true;
    script.type = 'application/javascript';
    script.src = 'https://www.revyoos.com/js/widgetBuilder.js';
    script.setAttribute('data-revyoos-widget', widgetCode);
    
    // Add it to the document
    document.body.appendChild(script);
    
    // Cleanup on unmount
    return () => {
      document.body.removeChild(script);
    };
  }, [widgetCode]);

  // This component doesn't render anything
  return null;
};

export default RevyoosScriptLoader;