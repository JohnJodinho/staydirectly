import React from 'react';

interface RevyoosWidgetProps {
  className?: string;
  widgetCode?: string;
}

const RevyoosWidget: React.FC<RevyoosWidgetProps> = ({ className, widgetCode }) => {
  // Create a pre-configured iframe that loads the Revyoos widget without adding scripts to the head
  if (!widgetCode) {
    return (
      <div className={`text-center p-8 border rounded-md bg-gray-50 ${className || ''}`}>
        <p className="text-gray-500">Review widget not configured for this property</p>
      </div>
    );
  }

  // Create a direct iframe to the Revyoos widget
  // Using proper embed format for Revyoos
  const iframeSrc = `https://www.revyoos.com/embed/widget?p=${widgetCode.replace('eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVjIn0=', '65e0fb5920ea00061275ec')}`;

  return (
    <div className={`w-full max-w-full overflow-hidden ${className || ''}`}>
      <iframe 
        src={iframeSrc}
        title="Revyoos Guest Reviews"
        className="w-full"
        style={{ 
          border: 'none',
          minHeight: '400px',
          width: '100%',
          maxWidth: '100%'
        }}
      />
    </div>
  );
};

export default RevyoosWidget;