import { GridState, SimulationParams, CursorState, Diagnostics, SeededRNG } from './types';

export function initializeGrid(N: number): GridState {
  const dx = 1.0 / N;

  return {
    N,
    dx,
    u: new Float32Array((N + 1) * N),
    v: new Float32Array(N * (N + 1)),
    uNext: new Float32Array((N + 1) * N),
    vNext: new Float32Array(N * (N + 1)),
    p: new Float32Array(N * N),
    div: new Float32Array(N * N),
    omega: new Float32Array(N * N),
    speed: new Float32Array(N * N),
    gradMag: new Float32Array(N * N),
    Fx: new Float32Array((N + 1) * N),
    Fy: new Float32Array(N * (N + 1)),
    lockedFx: new Float32Array((N + 1) * N),
    lockedFy: new Float32Array(N * (N + 1)),
    rng: new SeededRNG(42),
  };
}

export function applyInflowBC(
  state: GridState,
  params: SimulationParams,
  t: number
): void {
  const { N, u, v } = state;
  const { inflowVelocity, inflowProfile } = params;

  for (let j = 0; j < N; j++) {
    const y = (j + 0.5) / N;
    let profile = 1.0;

    switch (inflowProfile) {
      case 'Uniform':
        profile = 1.0;
        break;
      case 'Parabolic':
        profile = 4 * y * (1 - y);
        break;
      case 'Sinusoidal':
        profile = Math.sin(Math.PI * y);
        break;
      case 'Noisy':
        profile = 1.0 + 0.3 * Math.sin(2 * Math.PI * y + t * 2) * Math.cos(t * 3);
        break;
    }

    u[j * (N + 1)] = inflowVelocity * profile;
  }

  for (let j = 0; j <= N; j++) {
    v[j] = 0;
  }
}

export function composeForces(
  state: GridState,
  cursor: CursorState,
  params: SimulationParams
): { Fx: Float32Array; Fy: Float32Array } {
  const { N, Fx, Fy, lockedFx, lockedFy } = state;
  const { forceMagnitude, forceRadius, forceSigma, forceDirection } = params;

  Fx.fill(0);
  Fy.fill(0);

  if (cursor.locked) {
    for (let i = 0; i < Fx.length; i++) Fx[i] = lockedFx[i];
    for (let i = 0; i < Fy.length; i++) Fy[i] = lockedFy[i];
    return { Fx, Fy };
  }

  const cursorY = cursor.y;
  const sigma2 = forceSigma * forceSigma;

  for (let j = 0; j < N; j++) {
    const y = (j + 0.5) / N;
    const dy = y - cursorY;
    const dist2 = dy * dy;

    if (Math.sqrt(dist2) > forceRadius / N) continue;

    const weight = Math.exp(-dist2 / (2 * sigma2 / (N * N)));

    for (let i = 0; i <= Math.min(5, N); i++) {
      const idx = j * (N + 1) + i;

      switch (forceDirection) {
        case 'Rightward':
          Fx[idx] = forceMagnitude * weight;
          break;
        case 'Upward':
          if (i < N) {
            const vIdx = j * N + i;
            Fy[vIdx] = forceMagnitude * weight;
          }
          break;
        case 'Swirl':
          Fx[idx] = -forceMagnitude * weight * dy * N;
          if (i < N) {
            const vIdx = j * N + i;
            Fy[vIdx] = forceMagnitude * weight * 0.1;
          }
          break;
      }
    }
  }

  return { Fx, Fy };
}

export function applyForces(
  state: GridState,
  Fx: Float32Array,
  Fy: Float32Array,
  dt: number
): void {
  const { u, v } = state;

  for (let i = 0; i < u.length; i++) {
    u[i] += dt * Fx[i];
  }

  for (let i = 0; i < v.length; i++) {
    v[i] += dt * Fy[i];
  }
}

function sampleU(state: GridState, x: number, y: number): number {
  const { N, u } = state;
  const i = Math.floor(x * N);
  const j = Math.floor(y * N - 0.5);

  if (i < 0 || i >= N + 1 || j < 0 || j >= N) return 0;

  return u[j * (N + 1) + i];
}

function sampleV(state: GridState, x: number, y: number): number {
  const { N, v } = state;
  const i = Math.floor(x * N - 0.5);
  const j = Math.floor(y * N);

  if (i < 0 || i >= N || j < 0 || j >= N + 1) return 0;

  return v[j * N + i];
}

function bilinearU(state: GridState, x: number, y: number): number {
  const { N, u } = state;
  const fx = x * N;
  const fy = y * N - 0.5;

  const i = Math.floor(fx);
  const j = Math.floor(fy);

  const tx = fx - i;
  const ty = fy - j;

  const i0 = Math.max(0, Math.min(N, i));
  const i1 = Math.max(0, Math.min(N, i + 1));
  const j0 = Math.max(0, Math.min(N - 1, j));
  const j1 = Math.max(0, Math.min(N - 1, j + 1));

  const v00 = u[j0 * (N + 1) + i0];
  const v10 = u[j0 * (N + 1) + i1];
  const v01 = u[j1 * (N + 1) + i0];
  const v11 = u[j1 * (N + 1) + i1];

  return (1 - tx) * (1 - ty) * v00 + tx * (1 - ty) * v10 + (1 - tx) * ty * v01 + tx * ty * v11;
}

function bilinearV(state: GridState, x: number, y: number): number {
  const { N, v } = state;
  const fx = x * N - 0.5;
  const fy = y * N;

  const i = Math.floor(fx);
  const j = Math.floor(fy);

  const tx = fx - i;
  const ty = fy - j;

  const i0 = Math.max(0, Math.min(N - 1, i));
  const i1 = Math.max(0, Math.min(N - 1, i + 1));
  const j0 = Math.max(0, Math.min(N, j));
  const j1 = Math.max(0, Math.min(N, j + 1));

  const v00 = v[j0 * N + i0];
  const v10 = v[j0 * N + i1];
  const v01 = v[j1 * N + i0];
  const v11 = v[j1 * N + i1];

  return (1 - tx) * (1 - ty) * v00 + tx * (1 - ty) * v10 + (1 - tx) * ty * v01 + tx * ty * v11;
}

export function advectVelocity(state: GridState, dt: number, dx: number): void {
  const { N, u, v, uNext, vNext } = state;

  for (let j = 0; j < N; j++) {
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      const y = (j + 0.5) / N;

      const ux = bilinearU(state, x, y);
      const uy = bilinearV(state, x, y);

      const x0 = x - ux * dt;
      const y0 = y - uy * dt;

      uNext[j * (N + 1) + i] = bilinearU(state, x0, y0);
    }
  }

  for (let j = 0; j <= N; j++) {
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N;
      const y = j / N;

      const vx = bilinearU(state, x, y);
      const vy = bilinearV(state, x, y);

      const x0 = x - vx * dt;
      const y0 = y - vy * dt;

      vNext[j * N + i] = bilinearV(state, x0, y0);
    }
  }

  u.set(uNext);
  v.set(vNext);
}

export function applyViscousBlur(
  state: GridState,
  nu: number,
  iterations: number
): void {
  const { N, u, v, uNext, vNext } = state;
  const alpha = nu * 0.1;

  for (let iter = 0; iter < iterations; iter++) {
    for (let j = 0; j < N; j++) {
      for (let i = 1; i < N; i++) {
        const idx = j * (N + 1) + i;
        const left = u[idx - 1];
        const right = u[idx + 1];
        const down = j > 0 ? u[(j - 1) * (N + 1) + i] : u[idx];
        const up = j < N - 1 ? u[(j + 1) * (N + 1) + i] : u[idx];

        uNext[idx] = (1 - alpha) * u[idx] + alpha * 0.25 * (left + right + down + up);
      }
    }

    for (let j = 1; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const idx = j * N + i;
        const left = i > 0 ? v[idx - 1] : v[idx];
        const right = i < N - 1 ? v[idx + 1] : v[idx];
        const down = v[(j - 1) * N + i];
        const up = v[(j + 1) * N + i];

        vNext[idx] = (1 - alpha) * v[idx] + alpha * 0.25 * (left + right + down + up);
      }
    }

    u.set(uNext);
    v.set(vNext);
  }
}

export function enforceBoundaries(
  state: GridState,
  bc: 'Free-slip' | 'No-slip'
): void {
  const { N, u, v } = state;

  for (let i = 0; i <= N; i++) {
    if (bc === 'No-slip') {
      u[i] = 0;
      u[(N - 1) * (N + 1) + i] = 0;
    }
  }

  for (let j = 0; j <= N; j++) {
    v[j * N] = 0;
    v[j * N + N - 1] = 0;
  }

  const damping = 0.998;
  for (let i = 0; i < u.length; i++) u[i] *= damping;
  for (let i = 0; i < v.length; i++) v[i] *= damping;
}

export function computeDivergence(state: GridState, dx: number): Float32Array {
  const { N, u, v, div } = state;

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const uRight = u[j * (N + 1) + i + 1];
      const uLeft = u[j * (N + 1) + i];
      const vUp = v[(j + 1) * N + i];
      const vDown = v[j * N + i];

      div[j * N + i] = ((uRight - uLeft) + (vUp - vDown)) / dx;
    }
  }

  return div;
}

export function computeVorticity(state: GridState, dx: number): Float32Array {
  const { N, u, v, omega } = state;

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const vRight = i < N - 1 ? v[j * N + i + 1] : v[j * N + i];
      const vLeft = i > 0 ? v[j * N + i - 1] : v[j * N + i];
      const uUp = j < N - 1 ? u[(j + 1) * (N + 1) + i] : u[j * (N + 1) + i];
      const uDown = j > 0 ? u[(j - 1) * (N + 1) + i] : u[j * (N + 1) + i];

      const dvdx = (vRight - vLeft) / (2 * dx);
      const dudy = (uUp - uDown) / (2 * dx);

      omega[j * N + i] = dvdx - dudy;
    }
  }

  return omega;
}

export function computeSpeed(state: GridState): Float32Array {
  const { N, u, v, speed } = state;

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const uc = 0.5 * (u[j * (N + 1) + i] + u[j * (N + 1) + i + 1]);
      const vc = 0.5 * (v[j * N + i] + v[(j + 1) * N + i]);

      speed[j * N + i] = Math.sqrt(uc * uc + vc * vc);
    }
  }

  return speed;
}

export function computeGradMag(state: GridState, dx: number): Float32Array {
  const { N, speed, gradMag } = state;

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const center = speed[j * N + i];

      const left = i > 0 ? speed[j * N + (i - 1)] : center;
      const right = i < N - 1 ? speed[j * N + (i + 1)] : center;
      const down = j > 0 ? speed[(j - 1) * N + i] : center;
      const up = j < N - 1 ? speed[(j + 1) * N + i] : center;

      const dsdx = (right - left) / (2 * dx);
      const dsdy = (up - down) / (2 * dx);

      gradMag[j * N + i] = Math.hypot(dsdx, dsdy);
    }
  }

  return gradMag;
}

export function updateDiagnostics(state: GridState, dt: number): Diagnostics {
  const { N, dx, speed, omega, div } = state;

  let maxSpeed = 0;
  let kineticEnergy = 0;
  let enstrophy = 0;
  let maxDivergence = 0;
  let maxVorticity = 0;

  for (let i = 0; i < N * N; i++) {
    maxSpeed = Math.max(maxSpeed, speed[i]);
    kineticEnergy += 0.5 * speed[i] * speed[i];
    enstrophy += 0.5 * omega[i] * omega[i];
    maxDivergence = Math.max(maxDivergence, Math.abs(div[i]));
    maxVorticity = Math.max(maxVorticity, Math.abs(omega[i]));
  }

  kineticEnergy /= N * N;
  enstrophy /= N * N;

  const cfl = (maxSpeed * dt) / dx;

  return {
    dt,
    cfl,
    kineticEnergy,
    enstrophy,
    maxDivergence,
    maxVorticity,
  };
}

export function lockForces(state: GridState): void {
  state.lockedFx.set(state.Fx);
  state.lockedFy.set(state.Fy);
}

export function unlockForces(state: GridState): void {
  state.lockedFx.fill(0);
  state.lockedFy.fill(0);
}
