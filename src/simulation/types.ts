export interface GridState {
  N: number;
  dx: number;
  u: Float32Array;
  v: Float32Array;
  uNext: Float32Array;
  vNext: Float32Array;
  p: Float32Array;
  div: Float32Array;
  omega: Float32Array;
  speed: Float32Array;
  gradMag: Float32Array;
  Fx: Float32Array;
  Fy: Float32Array;
  lockedFx: Float32Array;
  lockedFy: Float32Array;
  rng: SeededRNG;
}

export interface SimulationParams {
  reynoldsNumber: number;
  inflowVelocity: number;
  inflowProfile: 'Uniform' | 'Parabolic' | 'Sinusoidal' | 'Noisy';
  forceMagnitude: number;
  forceRadius: number;
  forceSigma: number;
  forceDirection: 'Rightward' | 'Upward' | 'Swirl';
  autoCFL: boolean;
  dt: number;
  boundaryCondition: 'Free-slip' | 'No-slip';
}

export interface CursorState {
  y: number;
  locked: boolean;
}

export interface Diagnostics {
  dt: number;
  cfl: number;
  kineticEnergy: number;
  enstrophy: number;
  maxDivergence: number;
  maxVorticity: number;
}

export type DisplayMode = 'Pressure' | 'Velocity' | 'Divergence' | 'Vorticity' | 'Speed' | 'Gradient Magnitude';

export class SeededRNG {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextGaussian(): number {
    const u1 = this.next();
    const u2 = this.next();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
