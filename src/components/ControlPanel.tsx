import { SimulationParams, DisplayMode } from '../simulation/types';

interface ControlPanelProps {
  params: SimulationParams;
  displayMode: DisplayMode;
  arrowDensity: number;
  logScale: boolean;
  playing: boolean;
  onParamsChange: (params: SimulationParams) => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onArrowDensityChange: (density: number) => void;
  onLogScaleChange: (enabled: boolean) => void;
  onPlayPauseToggle: () => void;
  onStep: () => void;
}

export function ControlPanel({
  params,
  displayMode,
  arrowDensity,
  logScale,
  playing,
  onParamsChange,
  onDisplayModeChange,
  onArrowDensityChange,
  onLogScaleChange,
  onPlayPauseToggle,
  onStep,
}: ControlPanelProps) {
  const updateParam = <K extends keyof SimulationParams>(
    key: K,
    value: SimulationParams[K]
  ) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <div className="w-80 bg-gray-800 rounded-lg shadow-2xl p-6 space-y-6 overflow-y-auto max-h-screen">
      <h2 className="text-2xl font-bold text-white mb-4">Controls</h2>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={onPlayPauseToggle}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={onStep}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Step
          </button>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Display Mode
          </label>
          <select
            value={displayMode}
            onChange={(e) => onDisplayModeChange(e.target.value as DisplayMode)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
          >
            <option value="Pressure">Pressure</option>
            <option value="Velocity">Velocity</option>
            <option value="Divergence">Divergence</option>
            <option value="Vorticity">Vorticity</option>
            <option value="Speed">Speed</option>
            <option value="Gradient Magnitude">Gradient Magnitude</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Reynolds Number: {params.reynoldsNumber.toExponential(2)}
          </label>
          <input
            type="range"
            min="1"
            max="7"
            step="0.01"
            value={Math.log10(params.reynoldsNumber)}
            onChange={(e) => updateParam('reynoldsNumber', Math.pow(10, Number(e.target.value)))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>10¹</span>
            <span>10⁴</span>
            <span>10⁷</span>
          </div>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Inflow Velocity: {params.inflowVelocity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={params.inflowVelocity}
            onChange={(e) => updateParam('inflowVelocity', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Inflow Profile
          </label>
          <select
            value={params.inflowProfile}
            onChange={(e) =>
              updateParam(
                'inflowProfile',
                e.target.value as SimulationParams['inflowProfile']
              )
            }
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
          >
            <option value="Uniform">Uniform</option>
            <option value="Parabolic">Parabolic</option>
            <option value="Sinusoidal">Sinusoidal</option>
            <option value="Noisy">Noisy</option>
          </select>
        </div>

        <div className="border-t border-gray-600 pt-4">
          <h3 className="text-lg font-semibold text-white mb-3">Force Cursor</h3>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Force Magnitude: {params.forceMagnitude.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={params.forceMagnitude}
              onChange={(e) => updateParam('forceMagnitude', Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Force Radius: {params.forceRadius}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={params.forceRadius}
              onChange={(e) => updateParam('forceRadius', Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Force Sigma: {params.forceSigma.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={params.forceSigma}
              onChange={(e) => updateParam('forceSigma', Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Force Direction
            </label>
            <select
              value={params.forceDirection}
              onChange={(e) =>
                updateParam(
                  'forceDirection',
                  e.target.value as SimulationParams['forceDirection']
                )
              }
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
            >
              <option value="Rightward">Rightward</option>
              <option value="Upward">Upward</option>
              <option value="Swirl">Swirl</option>
            </select>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-4">
          <h3 className="text-lg font-semibold text-white mb-3">Display Options</h3>

          {displayMode === 'Velocity' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Arrow Density: {arrowDensity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.1"
                value={arrowDensity}
                onChange={(e) => onArrowDensityChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {displayMode !== 'Velocity' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="logScale"
                checked={logScale}
                onChange={(e) => onLogScaleChange(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="logScale" className="text-gray-300 text-sm">
                Logarithmic Color Scale
              </label>
            </div>
          )}
        </div>

        <div className="border-t border-gray-600 pt-4">
          <h3 className="text-lg font-semibold text-white mb-3">Boundary Conditions</h3>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Top/Bottom
            </label>
            <select
              value={params.boundaryCondition}
              onChange={(e) =>
                updateParam(
                  'boundaryCondition',
                  e.target.value as SimulationParams['boundaryCondition']
                )
              }
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
            >
              <option value="Free-slip">Free-slip</option>
              <option value="No-slip">No-slip</option>
            </select>
          </div>

          <div className="flex items-center mt-3">
            <input
              type="checkbox"
              id="autoCFL"
              checked={params.autoCFL}
              onChange={(e) => updateParam('autoCFL', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="autoCFL" className="text-gray-300 text-sm">
              Auto-CFL Timestep
            </label>
          </div>

          {!params.autoCFL && (
            <div className="mt-3">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Fixed dt: {params.dt.toFixed(4)}
              </label>
              <input
                type="range"
                min="0.0001"
                max="0.01"
                step="0.0001"
                value={params.dt}
                onChange={(e) => updateParam('dt', Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
