import React, { useRef, useState, useEffect } from 'react';
import { controlsRef } from '../store';

export const Joystick: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    setActive(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxDist = rect.width / 2;

    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Normalize
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    setPosition({ x: dx, y: dy });

    // Update global controls
    controlsRef.current.moveX = dx / maxDist;
    controlsRef.current.moveY = -dy / maxDist; // Inverted Y for forward/back
  };

  const handleTouchEnd = () => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    controlsRef.current.moveX = 0;
    controlsRef.current.moveY = 0;
  };

  return (
    <div
      ref={containerRef}
      className="absolute bottom-10 left-10 w-32 h-32 rounded-full border-2 border-white/20 bg-black/30 backdrop-blur-sm touch-none z-50 flex items-center justify-center pointer-events-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={stickRef}
        className={`w-12 h-12 rounded-full bg-white/50 shadow-lg transition-transform duration-75 ${!active ? 'transition-all duration-300' : ''}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      />
    </div>
  );
};