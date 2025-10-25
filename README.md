# 🌀 Euler Fluid Two

### 2-D Interactive Euler Fluid Flow Simulation  
**Author:** Pablo, ChatG 5 + Bolt 2
**Origin:** Design + discussion migrated from Bolt prototype (Oct 2025)

---

## 🎯 Goal

Create a real-time, browser-based 2-D Euler fluid simulator that lets users **experiment with flow, forces, and turbulence formation**, and ultimately explore granular approximations and potential singular behaviors relevant to the **Navier–Stokes Millennium Problem**.

The project doubles as both:
- an **intuitive visualization playground** for fluid dynamics, and  
- a **computational testbed** for voxel-automata / fractal-forcing experiments.

---

## 🧩 Overview

### Simulation model
- Incompressible **Euler** equations (set viscosity ν → 0).  
- Implemented on a **MAC grid** (staggered velocity, centered pressure).  
- Time integration via semi-Lagrangian advection + projection loop (to be added).  
- Stub version uses procedural advection for visual flow until solver is complete.

### Visualization
- 128×128 grid by default  
- Switchable display modes: `Pressure`, `Velocity`, `Divergence`, `Vorticity`, `Speed`, `Gradient Magnitude`  
- Colorization:  
  - White = 0  
  - Blue = −  
  - Red = +  
  - Symmetric logarithmic mapping for smooth scaling  
- Optional overlays: streamlines, isobars, grid lines  
- Vector field arrows colored by orientation (blue → red for left→right)

---

## 🧮 Core Simulation Parameters

| Control | Description |
|----------|--------------|
| **Reynolds Number** | Sets viscosity ν = U_ref × L_ref / Re |
| **Inflow Velocity** | Applied at left boundary; controls base flow speed |
| **Inflow Profile** | `Uniform`, `Parabolic`, `Sinusoidal`, `Noisy` |
| **Auto-CFL** | Adjust timestep dynamically based on max |u| |
| **Force Cursor** | Interactive Gaussian body-force perturbation on left edge |
| &nbsp;&nbsp;• Magnitude (`fPer`) | Peak force strength |
| &nbsp;&nbsp;• Radius (`fRad`) | Force influence radius in grid cells |
| &nbsp;&nbsp;• Sigma | Gaussian variance controlling smoothness |
| &nbsp;&nbsp;• Direction | `Rightward`, `Upward`, `Swirl` |
| **Boundary Conditions** | Left: inflow, Right: outflow (zero gradient), Top/Bottom: free-slip or no-slip |
| **Demo Modes** | `Calm Inflow`, `Wavy Inlet`, `Noisy Inlet`, `Swirl Kick` |

**Cursor Controls**
- Move vertically along the left edge to place the perturbation.  
- Press **spacebar** to lock/unlock a persistent force blob.  

---

## 🧰 Diagnostics

| Quantity | Description |
|-----------|--------------|
| `dt` | Current timestep |
| `CFL` | Courant number (maxSpeed × dt / dx) |
| `Kinetic Energy` | ½⟨u² + v²⟩ |
| `Enstrophy` | ½⟨ω²⟩ |
| `Max Divergence` | Numerical divergence magnitude |
| `Max Vorticity` | Maximum curl |
| `FPS` | Frame rate |

Displayed live in the diagnostics panel.

---

## 🧠 Architecture Plan (for Codex workspace)

Source layout:
```
src/
app/
App.tsx
ui/Controls.tsx
ui/Diagnostics.tsx
sim/
constants.ts
types.ts
state.ts
boundaries.ts
forces.ts
advect_stub.ts
diagnostics.ts
render/
colormap.ts
scalarCanvas.ts
quiverCanvas.ts
update.ts
styles.css
```


### Key responsibilities

- **`forces.ts`** — builds Gaussian perturbation field; applies to faces  
- **`advect_stub.ts`** — fake semi-Lagrangian or curl-noise transport for visuals  
- **`diagnostics.ts`** — compute divergence, vorticity, speed, grad-mag + summary stats  
- **`render/*`** — canvas color mapping + quiver overlay  
- **`update.ts`** — orchestrates per-frame simulation step  
- **`Controls.tsx`** — all UI sliders/dropdowns/toggles  
- **`Diagnostics.tsx`** — read-only output display  

---

## 🔬 Numerical Core (planned)

Per-frame loop for the full solver:

1. Apply inflow boundary conditions  
2. Add body forces (`applyForces`)  
3. Advect velocity (`advectVelocity`)  
4. Optionally diffuse (`viscousBlur`)  
5. Project:  
   - Solve Poisson ∇²p = (1/dt) ∇·u  
   - Subtract pressure gradient → u′  
6. Enforce boundaries again  
7. Compute diagnostics + visualize

---

## 🧩 Rendering Details

- **Scalar colorizer:**
```
x = sign(s) * log(1 + α|s|) / log(1 + α m)
```

with `α ≈ 4`, `m = max(|s_min|, |s_max|)`.  
- **Quiver:** subsample grid by user-selected density; length ∝ ‖u‖; hue by uₓ sign.

---

## 🧠 Experimental Goals

- Observe laminar → turbulent transitions as Re ↑.  
- Measure divergence, vorticity, and ∥∇u∥ growth under refinement.  
- Integrate voxel-automata forcing (later phase) to explore scaling of dissipation vs. singularity.  
- Build intuition for energy cascade, fractal forcing, and “finite-time blow-up” analogues.

---

## 🔗 Origins

This spec evolved from Bolt prototypes at:
- [Live App (Bolt Host)](https://euler-fluid-two.bolt.host)  
- [GitHub Repo](https://github.com/pablo-mayrgundter/euler-fluid-two)

---

## 🧱 Next Steps

### Issues
See our [issues](https://github.com/pablo-mayrgundter/euler-fluid-two/issues?q=is%3Aissue%20state%3Aopen%20label%3Abug) list.

### Feature Requests

See our [enhancements](https://github.com/pablo-mayrgundter/euler-fluid-two/issues?q=is%3Aissue%20state%3Aopen%20label%3Aenhancement) list.

---

*“We’ll start with smooth waves, then stir the edge of chaos.”*
