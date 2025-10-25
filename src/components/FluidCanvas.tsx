import { useEffect, useRef } from 'react';
import { GridState, DisplayMode } from '../simulation/types';

interface FluidCanvasProps {
  state: GridState;
  displayMode: DisplayMode;
  arrowDensity: number;
  logScale: boolean;
}

export function FluidCanvas({ state, displayMode, arrowDensity, logScale }: FluidCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { N } = state;
    const cellSize = canvas.width / N;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (displayMode === 'Velocity') {
      renderVectorField(ctx, state, cellSize, arrowDensity);
    } else {
      renderScalarField(ctx, state, displayMode, cellSize, logScale);
    }
  }, [state, displayMode, arrowDensity, logScale]);

  return (
    <canvas
      ref={canvasRef}
      width={512}
      height={512}
      className="border-2 border-gray-700 rounded-lg shadow-2xl"
    />
  );
}

function renderScalarField(
  ctx: CanvasRenderingContext2D,
  state: GridState,
  mode: DisplayMode,
  cellSize: number,
  logScale: boolean
) {
  const { N } = state;
  let data: Float32Array;

  switch (mode) {
    case 'Pressure':
      data = state.p;
      break;
    case 'Divergence':
      data = state.div;
      break;
    case 'Vorticity':
      data = state.omega;
      break;
    case 'Speed':
      data = state.speed;
      break;
    case 'Gradient Magnitude':
      data = state.gradMag;
      break;
    default:
      data = state.p;
  }

  let minVal = Infinity;
  let maxVal = -Infinity;

  for (let i = 0; i < data.length; i++) {
    minVal = Math.min(minVal, data[i]);
    maxVal = Math.max(maxVal, data[i]);
  }

  const maxMag = Math.max(Math.abs(minVal), Math.abs(maxVal));

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const val = data[j * N + i];
      const normalized = logScale ? normalizeLog(val, maxMag) : val / (maxMag + 1e-6);

      const color = valueToColor(normalized);

      ctx.fillStyle = color;
      ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
    }
  }
}

function normalizeLog(value: number, maxMag: number): number {
  const alpha = 4;
  const sign = Math.sign(value);
  const absVal = Math.abs(value);
  const mapped = (sign * Math.log(1 + alpha * absVal)) / Math.log(1 + alpha * maxMag);
  return mapped;
}

function valueToColor(normalized: number): string {
  const clamped = Math.max(-1, Math.min(1, normalized));

  if (clamped < 0) {
    const t = -clamped;
    const r = Math.floor(255 * (1 - t));
    const g = Math.floor(255 * (1 - t));
    const b = 255;
    return `rgb(${r},${g},${b})`;
  } else {
    const t = clamped;
    const r = 255;
    const g = Math.floor(255 * (1 - t));
    const b = Math.floor(255 * (1 - t));
    return `rgb(${r},${g},${b})`;
  }
}

function renderVectorField(
  ctx: CanvasRenderingContext2D,
  state: GridState,
  cellSize: number,
  density: number
) {
  const { N, u, v } = state;
  const step = Math.max(1, Math.floor(8 / density));

  let maxSpeed = 0;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const uc = 0.5 * (u[j * (N + 1) + i] + u[j * (N + 1) + i + 1]);
      const vc = 0.5 * (v[j * N + i] + v[(j + 1) * N + i]);
      const speed = Math.sqrt(uc * uc + vc * vc);
      maxSpeed = Math.max(maxSpeed, speed);
    }
  }

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, N * cellSize, N * cellSize);

  for (let j = 0; j < N; j += step) {
    for (let i = 0; i < N; i += step) {
      const uc = 0.5 * (u[j * (N + 1) + i] + u[j * (N + 1) + i + 1]);
      const vc = 0.5 * (v[j * N + i] + v[(j + 1) * N + i]);
      const speed = Math.sqrt(uc * uc + vc * vc);

      if (speed < 0.001) continue;

      const x = (i + 0.5) * cellSize;
      const y = (j + 0.5) * cellSize;

      const scale = 15;
      const length = Math.min(scale * speed / (maxSpeed + 0.01), cellSize * 1.5);
      const angle = Math.atan2(vc, uc);

      const opacity = Math.min(1, speed / (maxSpeed * 0.3 + 0.01));

      const hue = uc > 0 ? 0 : 240;
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${opacity})`;
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${opacity})`;
      ctx.lineWidth = 1.5;

      const ex = x + length * Math.cos(angle);
      const ey = y + length * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      const headSize = 3;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - headSize * Math.cos(angle - Math.PI / 6),
        ey - headSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        ex - headSize * Math.cos(angle + Math.PI / 6),
        ey - headSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }
  }
}
