import { useEffect, useRef } from 'react';
import { CursorState } from '../simulation/types';

interface CursorOverlayProps {
  cursor: CursorState;
  onCursorMove: (y: number) => void;
  width: number;
  height: number;
  radiusPx: number;
}

export function CursorOverlay({
  cursor,
  onCursorMove,
  width,
  height,
  radiusPx,
}: CursorOverlayProps) {
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
  const indicatorHeight = Math.max(10, 2 * radiusPx);
  const indicatorHalfHeight = indicatorHeight / 2;
  const labelY = Math.max(0, cursorPixelY - indicatorHalfHeight - 16);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ width, height }}
    >
      <div
        className="absolute left-0 w-1 rounded transition-all"
        style={{
          top: cursorPixelY,
          height: indicatorHeight,
          transform: `translateY(-${indicatorHalfHeight}px)`,
          backgroundColor: cursor.locked ? '#ef4444' : '#3b82f6',
        }}
      />
      {cursor.locked && (
        <div
          className="absolute left-2 text-xs font-semibold text-red-500"
          style={{ top: labelY }}
        >
          LOCKED
        </div>
      )}
    </div>
  );
}
