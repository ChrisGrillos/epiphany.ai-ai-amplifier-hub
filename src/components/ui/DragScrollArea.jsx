import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function DragScrollArea({ children, className, disabled = false }) {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (disabled) return;
    
    // Don't interfere with text selection or button clicks
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.tagName === 'INPUT') {
      return;
    }

    setIsDragging(true);
    setStartPos({
      x: e.clientX,
      y: e.clientY,
    });
    setScrollPos({
      x: scrollRef.current.scrollLeft,
      y: scrollRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || disabled) return;

    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;

    scrollRef.current.scrollLeft = scrollPos.x - dx;
    scrollRef.current.scrollTop = scrollPos.y - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startPos, scrollPos]);

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      className={cn(
        'overflow-auto',
        isDragging ? 'cursor-grabbing select-none' : 'cursor-grab',
        className
      )}
      style={{
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {children}
    </div>
  );
}