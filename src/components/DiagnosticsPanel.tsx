import { Diagnostics } from '../simulation/types';

interface DiagnosticsPanelProps {
  diagnostics: Diagnostics;
  fps: number;
}

export function DiagnosticsPanel({ diagnostics, fps }: DiagnosticsPanelProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Diagnostics</h2>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <DiagnosticItem label="FPS" value={fps.toFixed(1)} />
        <DiagnosticItem label="Timestep" value={diagnostics.dt.toExponential(2)} />
        <DiagnosticItem label="CFL" value={diagnostics.cfl.toFixed(3)} />
        <DiagnosticItem
          label="Kinetic Energy"
          value={diagnostics.kineticEnergy.toExponential(3)}
        />
        <DiagnosticItem
          label="Enstrophy"
          value={diagnostics.enstrophy.toExponential(3)}
        />
        <DiagnosticItem
          label="Max Divergence"
          value={diagnostics.maxDivergence.toFixed(4)}
        />
        <DiagnosticItem
          label="Max Vorticity"
          value={diagnostics.maxVorticity.toFixed(4)}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-600">
        <p className="text-xs text-gray-400">
          Press <kbd className="px-2 py-1 bg-gray-700 rounded text-white">Space</kbd> to lock/unlock force cursor
        </p>
      </div>
    </div>
  );
}

function DiagnosticItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-700 rounded p-3">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className="text-white font-mono font-semibold">{value}</div>
    </div>
  );
}
