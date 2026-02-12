# Mai Elamin's portfolio

A cinematic, infinite atmospheric simulation built with **React Three Fiber**, **Three.js**, and **Framer Motion**.

![Sky Simulation](https://raw.githubusercontent.com/username/repo/main/preview.png) *(Note: Placeholder for actual preview image)*

## Features ✨

- **Dynamic Day-Night Cycle**: A 180-second cycle that transitions through Night, Dawn, Day, and Dusk with custom color palettes and lighting.
- **Atmospheric Effects**:
  - **Procedural Clouds**: Volumetric-style clouds with custom shaders for realistic lighting and depth.
  - **Twinkling Starfield**: Thousands of high-performance stars with dynamic twinkling and pulsing effects.
  - **Aurora Borealis**: A subtle, procedurally generated Aurora that appears during night and twilight phases.
  - **Atmospheric Motes**: Drifting particles that add a sense of movement and scale.
- **Cinematic Experience**: 
  - Film grain and vignette overlays for a premium, movie-like look.
  - Smooth camera breathing and auto-rotation for a meditative feel.
  - Responsive design that adapts to any screen size.

## Tech Stack 🛠️

- **Core**: [React](https://reactjs.org/) & [Three.js](https://threejs.org/)
- **3D Bridge**: [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) & [@react-three/drei](https://github.com/pmndrs/drei)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Shaders**: GLSL (Custom Vertex & Fragment Shaders)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## Getting Started 🚀

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/welcome-to-the-sky.git
   cd welcome-to-the-sky
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## Architecture 🏛️

- `App.tsx`: Main application entry point orchestrating UI and 3D layers.
- `components/Experience.tsx`: 3D Canvas setup, cinematic camera, and scene controls.
- `components/Environment.tsx`: The heart of the simulation containing Procedural Clouds, Stars, Aurora, and the Day/Night cycle logic.
- `components/UIOverlay.tsx`: Minimalist, animated typographic layer.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Made with 💖 by Gemini AI*
