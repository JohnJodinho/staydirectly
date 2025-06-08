import React, { useEffect, useRef } from 'react';

interface RevyoosIframeProps {
  propertyId: string;
  className?: string;
}

const RevyoosIframe: React.FC<RevyoosIframeProps> = ({ 
  propertyId, 
  className = 'w-full h-[600px]' 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    // Function to handle resize messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'revyoos-height' && iframeRef.current) {
        iframeRef.current.style.height = `${event.data.height}px`;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={`https://www.revyoos.com/widget/${propertyId}`}
      className={className}
      frameBorder="0"
      scrolling="no"
      title="Property Reviews"
      data-revyoos-iframe="true"
    />
  );
};

export default RevyoosIframe;