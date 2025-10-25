import { useState, useEffect, useCallback, useRef } from 'react';
import { FluidCanvas } from './components/FluidCanvas';
import { ControlPanel } from './components/ControlPanel';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { CursorOverlay } from './components/CursorOverlay';
import {
  initializeGrid,
  applyInflowBC,
  composeForces,
  applyForces,
  advectVelocity,
  applyViscousBlur,
  enforceBoundaries,
  computeDivergence,
  computeVorticity,
  computeSpeed,
  computeGradMag,
  updateDiagnostics,
  lockForces,
  unlockForces,
} from './simulation/physics';
import { GridState, SimulationParams, CursorState, DisplayMode, Diagnostics } from './simulation/types';

const N = 128;

const initialParams: SimulationParams = {
  reynoldsNumber: 100,
  inflowVelocity: 0.5,
  inflowProfile: 'Uniform',
  forceMagnitude: 2.0,
  forceRadius: 20,
  forceSigma: 0.1,
  forceDirection: 'Rightward',
  autoCFL: true,
  dt: 0.001,
  boundaryCondition: 'Free-slip',
};

function App() {
  const [state, setState] = useState<GridState>(() => initializeGrid(N));
  const [params, setParams] = useState<SimulationParams>(initialParams);
  const [cursor, setCursor] = useState<CursorState>({ y: 0.5, locked: false });
  const [displayMode, setDisplayMode] = useState<DisplayMode>('Vorticity');
  const [arrowDensity, setArrowDensity] = useState(1.5);
  const [logScale, setLogScale] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [diagnostics, setDiagnostics] = useState<Diagnostics>({
    dt: 0.001,
    cfl: 0,
    kineticEnergy: 0,
    enstrophy: 0,
    maxDivergence: 0,
    maxVorticity: 0,
  });
  const [fps, setFps] = useState(60);

  const timeRef = useRef(0);
  const fpsFrames = useRef<number[]>([]);

  const step = useCallback(() => {
    setState((prevState) => {
      const newState = { ...prevState };

      applyInflowBC(newState, params, timeRef.current);

      const { Fx, Fy } = composeForces(newState, cursor, params);
      applyForces(newState, Fx, Fy, params.dt);

      let dt = params.dt;
      if (params.autoCFL) {
        const maxSpeed = Math.max(...Array.from(newState.speed));
        const cflTarget = 0.8;
        dt = Math.max(0.0001, Math.min(0.01, (cflTarget * newState.dx) / (maxSpeed + 1e-6)));
      }

      advectVelocity(newState, dt, newState.dx);

      const nu = 1.0 / params.reynoldsNumber;
      const viscIterations = Math.min(3, Math.floor(nu * 100));
      applyViscousBlur(newState, nu, viscIterations);

      enforceBoundaries(newState, params.boundaryCondition);

      computeDivergence(newState, newState.dx);
      computeVorticity(newState, newState.dx);
      computeSpeed(newState);
      computeGradMag(newState, newState.dx);

      for (let i = 0; i < newState.p.length; i++) {
        newState.p[i] = -newState.div[i] * 0.5;
      }

      const diag = updateDiagnostics(newState, dt);
      setDiagnostics(diag);

      timeRef.current += dt;

      return newState;
    });
  }, [params, cursor]);

  useEffect(() => {
    if (!playing) return;

    let animationId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      fpsFrames.current.push(1000 / deltaTime);
      if (fpsFrames.current.length > 30) fpsFrames.current.shift();
      const avgFps = fpsFrames.current.reduce((a, b) => a + b, 0) / fpsFrames.current.length;
      setFps(avgFps);

      step();

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [playing, step]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setCursor((prev) => {
          const newLocked = !prev.locked;
          if (newLocked) {
            lockForces(state);
          } else {
            unlockForces(state);
          }
          return { ...prev, locked: newLocked };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state]);

  const handleCursorMove = useCallback((y: number) => {
    setCursor((prev) => ({ ...prev, y }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
      <div className="flex gap-6 items-start">
        <ControlPanel
          params={params}
          displayMode={displayMode}
          arrowDensity={arrowDensity}
          logScale={logScale}
          playing={playing}
          onParamsChange={setParams}
          onDisplayModeChange={setDisplayMode}
          onArrowDensityChange={setArrowDensity}
          onLogScaleChange={setLogScale}
          onPlayPauseToggle={() => setPlaying(!playing)}
          onStep={step}
        />

        <div className="flex flex-col gap-6">
          <div className="relative">
            <FluidCanvas
              state={state}
              displayMode={displayMode}
              arrowDensity={arrowDensity}
              logScale={logScale}
            />
            <CursorOverlay cursor={cursor} onCursorMove={handleCursorMove} width={512} height={512} />
          </div>

          <DiagnosticsPanel diagnostics={diagnostics} fps={fps} />
        </div>
      </div>
    </div>
  );
}

export default App;
