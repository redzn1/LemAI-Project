import React from 'react';

interface ScrollControlsProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  variant?: 'floating' | 'inline' | 'compact';
  label?: boolean;
}

// User requested removal of all scroll buttons in favor of native system scrolling
export const ScrollControls: React.FC<ScrollControlsProps> = () => {
  return null;
};

