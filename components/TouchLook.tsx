import React, { useRef } from 'react';
import { controlsRef } from '../store';

export const TouchLook: React.FC = () => {
  const lastTouch = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    lastTouch.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!lastTouch.current) return;
    const touch = e.changedTouches[0];
    
    const dx = touch.clientX - lastTouch.current.x;
    const dy = touch.clientY - lastTouch.current.y;

    // Sensitivity factor
    const sensitivity = 0.005;

    controlsRef.current.lookX -= dx * sensitivity;
    controlsRef.current.lookY -= dy * sensitivity;

    // Clamp vertical look
    controlsRef.current.lookY = Math.max(-1.5, Math.min(1.5, controlsRef.current.lookY));

    lastTouch.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    lastTouch.current = null;
  };

  const handleClick = () => {
    const canvasEl = document.querySelector('canvas');
    if (canvasEl) {
      canvasEl.requestPointerLock?.();
    }
  };

  return (
    <div
      className="absolute top-0 right-0 w-full h-full z-40 touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    />
  );
};