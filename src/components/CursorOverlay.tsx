import { useEffect, useRef } from 'react';
import { CursorState } from '../simulation/types';

interface CursorOverlayProps {
  cursor: CursorState;
  onCursorMove: (y: number) => void;
  width: number;
  height: number;
}

export function CursorOverlay({ cursor, onCursorMove, width, height }: CursorOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = overlay.getBoundingClientRect();
      const y = (e.clientY - rect.top) / rect.height;
      onCursorMove(Math.max(0, Math.min(1, y)));
    };

    overlay.addEventListener('mousemove', handleMouseMove);

    return () => {
      overlay.removeEventListener('mousemove', handleMouseMove);
    };
  }, [onCursorMove]);

  const cursorPixelY = cursor.y * height;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ width, height }}
    >
      <div
        className="absolute left-0 w-1 h-8 -translate-y-4 transition-colors"
        style={{
          top: cursorPixelY,
          backgroundColor: cursor.locked ? '#ef4444' : '#3b82f6',
        }}
      />
      {cursor.locked && (
        <div
          className="absolute left-2 text-xs font-semibold text-red-500"
          style={{ top: cursorPixelY - 4 }}
        >
          LOCKED
        </div>
      )}
    </div>
  );
}
