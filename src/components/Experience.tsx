// Import React hooks and types for managing references and suspense boundaries
import React, { Suspense, useRef, useEffect } from 'react';
// Import Three.js fiber hooks for the render loop and the Canvas container
import { Canvas, useFrame } from '@react-three/fiber';
// Import helper components from drei for cameras and interaction controls
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
// Import the core Three.js library for mathematical utilities and vector operations
import * as THREE from 'three';
// Import the Environment component which contains the sky, stars, and atmospheric effects
import Environment from './Environment';

// Falling to earth: camera starts in the sky and descends as user scrolls
const CAM_Z_START = 8;
const CAM_Z_END = 2;
const CAM_Y_START = 0;   // start in the sky
const CAM_Y_END = -95;   // fall down toward earth
const FOV_START = 50;
const FOV_END = 68;

/** Turbulence: camera shake intensity when enabled */
const TURBULENCE_AMP = 0.22;
const TURBULENCE_FREQ = 4.5;

/**
 * CinematicCamera: scroll-driven fall toward earth (descend on Y, move forward on Z). Optional turbulence shake.
 */
const CinematicCamera: React.FC<{
  scrollProgressRef: React.MutableRefObject<number>;
  turbulenceRef: React.MutableRefObject<boolean>;
}> = ({ scrollProgressRef, turbulenceRef }) => {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const targetPos = useRef(new THREE.Vector3(0, CAM_Y_START, CAM_Z_START));
  const targetFovRef = useRef(FOV_START);

  useFrame(() => {
    const t = scrollProgressRef.current;
    targetPos.current.set(
      0,
      THREE.MathUtils.lerp(CAM_Y_START, CAM_Y_END, t),
      THREE.MathUtils.lerp(CAM_Z_START, CAM_Z_END, t)
    );
    targetFovRef.current = THREE.MathUtils.lerp(FOV_START, FOV_END, t);
  });

  useFrame((state) => {
    if (!camRef.current) return;

    const time = state.clock.getElapsedTime();

    // Lerp toward fall target (descending to earth)
    camRef.current.position.lerp(targetPos.current, 0.035);
    camRef.current.fov = THREE.MathUtils.lerp(camRef.current.fov, targetFovRef.current, 0.04);
    camRef.current.updateProjectionMatrix();

    // Stop all drift when layer is full (end of scroll)
    const atEnd = scrollProgressRef.current >= 0.98;
    const breath = atEnd ? 0 : 1 - scrollProgressRef.current * 0.8;
    camRef.current.position.y += Math.sin(time * 0.5) * 0.006 * breath;
    camRef.current.position.x += Math.cos(time * 0.3) * 0.006 * breath;

    // Turbulence: extra shake when enabled (outside the window)
    if (turbulenceRef.current) {
      camRef.current.position.x += Math.sin(time * TURBULENCE_FREQ) * TURBULENCE_AMP;
      camRef.current.position.y += Math.cos(time * TURBULENCE_FREQ * 1.1) * TURBULENCE_AMP;
      camRef.current.rotation.z = Math.sin(time * TURBULENCE_FREQ * 0.8) * 0.012;
    }
  });

  return <PerspectiveCamera ref={camRef} makeDefault far={2000} />;
};

/**
 * Main Experience component which initializes the WebGL Canvas and scene environment
 */
const Experience: React.FC<{
  scrollProgress?: number;
  turbulenceRef?: React.MutableRefObject<boolean>;
  onSkyColorChange?: (hex: string) => void;
}> = ({ scrollProgress = 0, turbulenceRef, onSkyColorChange }) => {
  // Ref so the render loop can read scroll progress without re-subscribing
  const scrollProgressRef = useRef(scrollProgress);
  const defaultTurbulenceRef = useRef(false);
  const turbRef = turbulenceRef ?? defaultTurbulenceRef;

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  return (
    <div className="fixed inset-0 w-full h-full" style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        style={{ display: 'block', width: '100%', height: '100%' }}
        dpr={1}
        gl={{
          antialias: true,
          alpha: false,
        }}
      >
        <CinematicCamera scrollProgressRef={scrollProgressRef} turbulenceRef={turbRef} />
        <Suspense fallback={null}>
          <Environment scrollProgressRef={scrollProgressRef} scrollProgress={scrollProgress} onSkyColorChange={onSkyColorChange} />
          {/* Slow auto-rotate; speed decreases as user scrolls in for a calmer arrival */}
          <OrbitControls
            autoRotate
            autoRotateSpeed={scrollProgress >= 0.98 ? 0 : 0.3 * (1 - scrollProgress * 0.8)}
            enablePan={false}
            enableZoom={false}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 2.2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Export the Experience component as the default export for this module
export default Experience;
