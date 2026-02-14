// Core React hooks for managing component lifecycle and state
import React, { useRef, useMemo, useState, useEffect } from 'react';
// Three.js Fiber's high-performance frame loop hook
import { useFrame } from '@react-three/fiber';
// Standard Three.js library for mathematical operations and object creation
import * as THREE from 'three';

// Constants for particle densities across different atmospheric layers
// Constants for particle densities across different atmospheric layers
const MOTE_COUNT = 120; // Reduced for performance
const STAR_COUNT = 250;
const BACKGROUND_STAR_COUNT = 800;
const TWINKLING_STAR_COUNT = 2000;
const CLOUD_COUNT = 25;
const EXTRA_CLOUD_COUNT = 100; // Reverted and reduced below 130 for stability
/** Exponent for cloud buildup: lower = clouds increase more steadily as user scrolls */
const CLOUD_BUILDUP_EXPONENT = 1.5;
/** From this scroll fraction onward, always use full extra clouds so end feels overwhelmingly cloudy */
const FULL_CLOUDS_FROM_NORMALIZED = 0.68;

// Immutable theme definition for different times of day/night
interface Theme {
  readonly atmosphere: string; // Bottom color of the sky dome
  readonly horizon: string; // Mid-level horizon mist color
  readonly space: string; // Top-most outer space color
  readonly fog: string; // Global scene fog color
  readonly motes: string; // Tint color for floating particles and stars
  readonly cloud: string; // Illumination color for volumetric clouds
  readonly starColor: string; // Complementary color for star glow
  readonly sunPos: [number, number, number]; // Vector position of the primary light source
  readonly ambient: number; // Global illumination intensity
}

// Cinematic color palettes and light settings for the simulation cycle
const THEMES: Record<string, Theme> = {
  NIGHT: {
    atmosphere: '#010206',
    horizon: '#050a14',
    space: '#000000',
    fog: '#000000',
    motes: '#a5b4fc',
    cloud: '#94a3b8',
    starColor: '#cbd5e1', // Lighter shade of the night sky (misty silver-blue)
    sunPos: [0, -1, -0.5],
    ambient: 0.1,
  },
  DAWN: {
    atmosphere: '#7dd3fc',
    horizon: '#bae6fd',
    space: '#0c4a6e',
    fog: '#bae6fd',
    motes: '#e0f2fe',
    cloud: '#f0f9ff',
    starColor: '#f0f9ff', // Pale sky blue
    sunPos: [1, 0.1, -0.8],
    ambient: 0.4,
  },
  DAY: {
    atmosphere: '#2563eb',
    horizon: '#60a5fa',
    space: '#000814',
    fog: '#051221',
    motes: '#ffffff',
    cloud: '#ffffff',
    starColor: '#dbeafe', // Very light blue
    sunPos: [0.5, 1, -0.5],
    ambient: 0.8,
  },
  DUSK: {
    atmosphere: '#4c1d95',
    horizon: '#7c3aed',
    space: '#020617',
    fog: '#0a0314',
    motes: '#e9d5ff',
    cloud: '#e9d5ff',
    starColor: '#f5f3ff', // Soft lavender white
    sunPos: [-1, 0.1, -0.8],
    ambient: 0.3,
  }
};

// Utility function to linearly interpolate between two hex color strings
const lerpColor = (c1: string, c2: string, a: number) => new THREE.Color(c1).lerp(new THREE.Color(c2), a);

/**
 * Calculates current themes and blend factor based on day/night cycle hour
 */
const getThemeState = (hour: number) => {
  let target: Theme, blend: Theme, alpha: number;
  if (hour >= 5 && hour < 8) { target = THEMES.NIGHT; blend = THEMES.DAWN; alpha = (hour - 5) / 3; }
  else if (hour >= 8 && hour < 17) { target = THEMES.DAWN; blend = THEMES.DAY; alpha = (hour - 8) / 9; }
  else if (hour >= 17 && hour < 21) { target = THEMES.DAY; blend = THEMES.DUSK; alpha = (hour - 17) / 4; }
  else { target = THEMES.DUSK; blend = THEMES.NIGHT; alpha = hour >= 21 ? (hour - 21) / 3 : (hour + 3) / 8; }
  return { target, blend, alpha };
};

/** When falling: clouds stream upward (world +Y) and rush toward us; values are scroll-state-driven so scrolling up reverses */
const FALL_CLOUD_Y_OFFSET_SCALE = 380; // total Y offset at full scroll — larger so clouds keep moving up through the whole scroll
const FALL_CLOUD_Y_CURVE = 1.22; // exponent > 1 so more rise in the second half (clouds don't flatten out)
const FALL_CLOUD_Z_BOOST = 1.2;
/** Scroll threshold: below this, clouds use original behaviour only (no falling effect). Higher = original start lasts longer. */
const FALL_CLOUD_SCROLL_THRESHOLD = 0.32;
/** End-of-scroll: no push — clouds continue (stay visible) as the user scrolls */
const EARTH_PUSH_SCROLL_THRESHOLD = 1.0; // disabled: clouds continue throughout scroll
const EARTH_PUSH_Y_EXTRA = 0;
const EARTH_PUSH_Z_RUSH = 1.0;

/**
 * Cloud component: volumetric clouds; when scroll = falling, they move up past us and rush forward
 */
const Cloud: React.FC<{
  index: number;
  color: THREE.Color;
  scrollProgressRef: React.MutableRefObject<number>;
}> = ({ color, scrollProgressRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const data = useMemo(() => {
    // Determine if this is a massive 'hero' cloud or a smaller wisp
    const isLarge = Math.random() > 0.8;
    // Calculate how many overlapping spheres make up this specific cloud
    const blobCount = isLarge ? Math.floor(8 + Math.random() * 6) : Math.floor(4 + Math.random() * 5);
    // Base scale multiplier for the overall cloud structure
    const cloudScaleBase = isLarge ? (2.5 + Math.random() * 2.0) : (0.6 + Math.random() * 1.4);

    // Per-cloud Y spread: so scroll doesn't push everyone into one band (0.5–1.5)
    const ySpread = 0.5 + Math.random();
    // At start clouds appear below the heading: band in lower sky
    const baseY = (Math.random() - 0.5) * 100 - 80;
    return {
      // Starting coordinates: wide X, low Y (below heading), spread Z
      pos: [(Math.random() - 0.5) * 700, baseY, (Math.random() - 0.2) * -1100],
      // Random rotation to add natural variation
      rotation: Math.random() * Math.PI * 2,
      // Array of individual blob spheres with varying offsets and sizes
      blobs: Array.from({ length: blobCount }).map(() => ({
        pos: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40],
        scale: (30 + Math.random() * 50) * cloudScaleBase
      })),
      // Drift speed along the Z-axis — more variance so they stay spread in depth
      speed: 0.015 + Math.random() * 0.1,
      // Seed for noise functions in the shader
      random: Math.random() * 1000,
      ySpread
    };
  }, []);

  useFrame((state) => {
    if (!groupRef.current || !materialRef.current) return;
    const time = state.clock.getElapsedTime();
    const rawT = scrollProgressRef.current;
    const baseY = data.pos[1] as number;

    // Use t=1 when at end of scroll so Y stays at final position, but keep movement (Z, X) running
    const atEndOfScroll = rawT >= 0.98;
    const t = atEndOfScroll
      ? 1
      : rawT <= FALL_CLOUD_SCROLL_THRESHOLD
        ? 0
        : (rawT - FALL_CLOUD_SCROLL_THRESHOLD) / (1 - FALL_CLOUD_SCROLL_THRESHOLD);
    const pushT = rawT <= EARTH_PUSH_SCROLL_THRESHOLD
      ? 0
      : (rawT - EARTH_PUSH_SCROLL_THRESHOLD) / (1 - EARTH_PUSH_SCROLL_THRESHOLD);
    const pushY = pushT * EARTH_PUSH_Y_EXTRA;
    const pushZMult = 1 + pushT * (EARTH_PUSH_Z_RUSH - 1);

    const zSpeed = data.speed * 1.2 * (1 + t * FALL_CLOUD_Z_BOOST) * pushZMult;
    groupRef.current.position.z += zSpeed;
    if (groupRef.current.position.z > 150) {
      groupRef.current.position.z = -850 + (data.random % 280);
    }

    const curvedT = Math.pow(t, FALL_CLOUD_Y_CURVE);
    const scrollY = curvedT * FALL_CLOUD_Y_OFFSET_SCALE * data.ySpread + pushY;
    groupRef.current.position.y = baseY + scrollY;

    groupRef.current.position.x += Math.sin(time * 0.03 + data.random) * 0.03;

    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uColor.value.copy(color);
    materialRef.current.uniforms.uGroupZ.value = groupRef.current.position.z;
  });

  return (
    // Wrap entire cloud structure in a group for collective movement
    <group ref={groupRef} position={data.pos as [number, number, number]} rotation={[0, data.rotation, 0]}>
      {/* Map through the pre-generated blobs to create the cloud volume */}
      {data.blobs.map((blob, i) => (
        <mesh key={i} position={blob.pos as [number, number, number]} scale={[blob.scale, blob.scale * 0.4, blob.scale * 0.5]}>
          <sphereGeometry args={[1, 12, 12]} />
          <shaderMaterial
            // Attach materialRef only to the primary blob to control the whole group
            ref={i === 0 ? materialRef : null}
            transparent depthWrite={false}
            uniforms={{
              uTime: { value: 0 },
              uColor: { value: new THREE.Color() },
              uRandom: { value: data.random + i },
              uGroupZ: { value: 0 }
            }}
            vertexShader={`
              varying vec3 vNormal; varying vec3 vViewPosition; varying vec3 vWorldPosition;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * mvPosition;
              }
            `}
            fragmentShader={`
              varying vec3 vNormal; varying vec3 vViewPosition; varying vec3 vWorldPosition;
              uniform vec3 uColor; uniform float uTime; uniform float uRandom; uniform float uGroupZ;
              float hash(float n) { return fract(sin(n) * 43758.5453123); }
              float noise(vec3 x) {
                vec3 p = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
                float n = p.x + p.y*57.0 + 113.0*p.z;
                return mix(mix(mix(hash(n+0.0),hash(n+1.0),f.x),mix(hash(n+57.0),hash(n+58.0),f.x),f.y),mix(mix(hash(n+113.0),hash(n+114.0),f.x),mix(hash(n+170.0),hash(n+171.0),f.x),f.y),f.z);
              }
              float fbm(vec3 p) {
                float fbm_v = 0.0;
                fbm_v += 0.5000 * noise(p); p = p * 2.02;
                fbm_v += 0.2500 * noise(p); p = p * 2.03;
                fbm_v += 0.1250 * noise(p); p = p * 2.01;
                fbm_v += 0.0625 * noise(p);
                return fbm_v;
              }
              void main() {
                vec3 normal = normalize(vNormal); vec3 viewDir = normalize(vViewPosition);
                float fresnel = pow(1.0 - dot(normal, viewDir), 2.8);
                vec3 noisePos = vWorldPosition * 0.06 + vec3(uTime * 0.01);
                float n = fbm(noisePos + uRandom);
                float density = smoothstep(0.35, 0.75, n * (1.0 - fresnel));
                float nearFade = smoothstep(120.0, 30.0, uGroupZ);
                float farFade = smoothstep(-850.0, -650.0, uGroupZ);
                float light = dot(normal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
                vec3 finalColor = mix(uColor * 0.9 + vec3(0.1), vec3(1.0), 0.4 + fresnel * 0.4);
                finalColor *= (0.75 + 0.25 * light);
                float alpha = density * 0.35 * nearFade * farFade;
                if (alpha < 0.001) discard;
                gl_FragColor = vec4(finalColor, alpha);
              }
            `}
          />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Clouds layer: more clouds as user scrolls (fills the screen); receives scroll ref for falling behavior
 */
const Clouds: React.FC<{
  color: THREE.Color;
  scrollProgressRef: React.MutableRefObject<number>;
  cloudCount: number;
}> = ({ color, scrollProgressRef, cloudCount }) => {
  return (
    <group>
      {Array.from({ length: cloudCount }).map((_, i) => (
        <Cloud key={i} index={i} color={color} scrollProgressRef={scrollProgressRef} />
      ))}
    </group>
  );
};

/**
 * Aurora component: Procedural polar lights that appear at night/dawn
 */
const Aurora: React.FC<{ timeOfDay: number }> = ({ timeOfDay }) => {
  // Reference for the aurora's sphere shader
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  // Calculate visibility intensity based on the time of day cycle
  const auroraIntensity = useMemo(() => {
    if (timeOfDay >= 4 && timeOfDay <= 9) return 1.0 - Math.abs(timeOfDay - 6.5) / 2.5;
    if (timeOfDay >= 16 && timeOfDay <= 22) return 1.0 - Math.abs(timeOfDay - 19) / 3.0;
    return 0.1;
  }, [timeOfDay]);
  // Initialize shader uniforms
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uIntensity: { value: 0 } }), []);

  // Animation loop for the aurora curtains
  useFrame((state) => {
    if (materialRef.current) {
      // Pass the running time to the noise functions in the fragment shader
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      // Smoothly interpolate intensity to avoid flickering during transitions
      materialRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uIntensity.value, auroraIntensity, 0.05);
    }
  });

  return (
    <mesh>
      {/* Render on a massive dome above the clouds */}
      <sphereGeometry args={[700, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <shaderMaterial
        ref={materialRef} side={THREE.BackSide} transparent depthWrite={false} uniforms={uniforms}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          uniform float uTime; uniform float uIntensity; varying vec2 vUv;
          float hash(float n) { return fract(sin(n) * 43758.5453123); }
          float noise(vec3 x) {
            vec3 p = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
            float n = p.x + p.y*57.0 + 113.0*p.z;
            return mix(mix(mix(hash(n+0.0),hash(n+1.0),f.x),mix(hash(n+57.0),hash(n+58.0),f.x),f.y),mix(mix(hash(n+113.0),hash(n+114.0),f.x),mix(hash(n+170.0),hash(n+171.0),f.x),f.y),f.z);
          }
          void main() {
            float y = vUv.y; float band = smoothstep(0.1, 0.4, y) * smoothstep(0.8, 0.5, y);
            if (band <= 0.0) discard;
            vec3 p = vec3(vUv * 10.0, uTime * 0.1); float n = noise(p * 1.5 + vec3(uTime * 0.05));
            float streaks = sin(vUv.x * 50.0 + n * 5.0 + uTime * 0.2) * 0.5 + 0.5;
            vec3 auroraColor = mix(vec3(0.1, 0.8, 0.4), vec3(0.4, 0.2, 0.9), n);
            gl_FragColor = vec4(auroraColor, band * streaks * n * uIntensity * 0.4);
          }
        `}
      />
    </mesh>
  );
};

/**
 * BackgroundStars: Distant static star field
 */
const BackgroundStars: React.FC<{ opacity: number; color: THREE.Color }> = ({ opacity, color }) => {
  // Generate a random sphere of star positions once
  const starData = useMemo(() => {
    const positions = new Float32Array(BACKGROUND_STAR_COUNT * 3);
    for (let i = 0; i < BACKGROUND_STAR_COUNT; i++) {
      const r = 850 + Math.random() * 150;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);
  // Initialize shader uniforms for color and global opacity
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color() }, uOpacity: { value: 0 } }), []);

  // Per-frame theme updates
  useFrame(() => {
    uniforms.uColor.value.set(color);
    uniforms.uOpacity.value = 0.15 * opacity;
  });

  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={BACKGROUND_STAR_COUNT} array={starData} itemSize={3} /></bufferGeometry>
      <shaderMaterial
        transparent depthWrite={false} uniforms={uniforms}
        vertexShader={`uniform vec3 uColor; uniform float uOpacity; varying vec3 vColor; void main() { vColor = uColor; vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0); gl_PointSize = 2.0 * (500.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition; }`}
        fragmentShader={`uniform vec3 uColor; uniform float uOpacity; varying vec3 vColor; void main() { float dist = distance(gl_PointCoord, vec2(0.5)); if (dist > 0.5) discard; float alpha = (1.0 - smoothstep(0.3, 0.5, dist)) * uOpacity; gl_FragColor = vec4(vColor, alpha); }`}
      />
    </points>
  );
};

/**
 * PulsingStars: Large, feature stars with rhythmic breathing animation
 */
const PulsingStars: React.FC<{ opacity: number; color: THREE.Color }> = ({ opacity, color }) => {
  // Reference for the shader material
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  // Generate a high-quality star field with per-star size and color variance
  const starData = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3), phases = new Float32Array(STAR_COUNT), sizes = new Float32Array(STAR_COUNT), colors = new Float32Array(STAR_COUNT * 3);
    const colorOptions = [new THREE.Color('#ffffff'), new THREE.Color('#bae6fd'), new THREE.Color('#fef3c7'), new THREE.Color('#f5f3ff')];
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 400 + Math.random() * 400, theta = 2 * Math.PI * Math.random(), phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = 0.5 + Math.random() * 3.5;
      const col = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    return { positions, phases, sizes, colors };
  }, []);
  // shader uniforms
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 1.0 }, uTintColor: { value: new THREE.Color() } }), []);

  // Animation logic for pulsing
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uOpacity.value = opacity;
      materialRef.current.uniforms.uTintColor.value.set(color);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={STAR_COUNT} array={starData.positions} itemSize={3} />
        <bufferAttribute attach="attributes-aPhase" count={STAR_COUNT} array={starData.phases} itemSize={1} />
        <bufferAttribute attach="attributes-aSize" count={STAR_COUNT} array={starData.sizes} itemSize={1} />
        <bufferAttribute attach="attributes-color" count={STAR_COUNT} array={starData.colors} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef} transparent depthWrite={false} uniforms={uniforms} vertexColors
        vertexShader={`uniform float uTime; attribute float aPhase; attribute float aSize; uniform float uOpacity; uniform vec3 uTintColor; varying float vBrightness; varying vec3 vColor; void main() { vColor = color; vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0); float pulse = sin(uTime * (1.2 + aSize * 0.4) + aPhase); float sharpPulse = pow(0.5 + 0.5 * pulse, 3.0); vBrightness = sharpPulse; float nearFade = smoothstep(1.0, 10.0, -mvPosition.z); vBrightness *= nearFade; gl_PointSize = aSize * (1.0 + sharpPulse * 0.8) * (500.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition; }`}
        fragmentShader={`varying float vBrightness; varying vec3 vColor; uniform vec3 uTintColor; uniform float uOpacity; void main() { float dist = distance(gl_PointCoord, vec2(0.5)); if (dist > 0.5) discard; float alpha = (smoothstep(0.5, 0.0, dist) + exp(-dist * 6.0) * 0.5) * vBrightness; gl_FragColor = vec4(mix(vColor, uTintColor, 0.5), alpha * 0.9 * uOpacity); }`}
      />
    </points>
  );
};

/**
 * AtmosphericMotes: Floating dust particles drifting in the foreground
 */
const AtmosphericMotes: React.FC<{ color: THREE.Color; opacity: number }> = ({ color, opacity }) => {
  // Reference for GPU particle manipulation
  const pointsRef = useRef<THREE.Points>(null);
  // Reference for shader constants
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  // Generate random motes within a viewport-focused volume
  const particles = useMemo(() => {
    const positions = new Float32Array(MOTE_COUNT * 3), randoms = new Float32Array(MOTE_COUNT);
    for (let i = 0; i < MOTE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      randoms[i] = Math.random();
    }
    return { positions, randoms };
  }, []);
  // Initialize uniforms
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color() }, uOpacity: { value: 1 } }), []);

  // Drift and pulse logic
  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < MOTE_COUNT; i++) {
      // Linear drift towards viewer
      positions[i * 3 + 2] += 0.015 * 1.2;
      // Reset to depth once out of bounds
      if (positions[i * 3 + 2] > 40) positions[i * 3 + 2] = -40;
    }
    // Inform Three.js that buffer data has changed
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    materialRef.current.uniforms.uColor.value.copy(color);
    materialRef.current.uniforms.uOpacity.value = opacity;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={MOTE_COUNT} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={MOTE_COUNT} array={particles.randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={uniforms}
        vertexShader={`uniform float uTime; attribute float aRandom; varying float vPulse; void main() { vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0); vPulse = (0.5 + 0.5 * sin(uTime * (1.5 + aRandom))) * smoothstep(1.0, 10.0, -mvPosition.z); gl_PointSize = 5.0 * vPulse * (300.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition; }`}
        fragmentShader={`uniform vec3 uColor; uniform float uOpacity; varying float vPulse; void main() { float dist = distance(gl_PointCoord, vec2(0.5)); if (dist > 0.5) discard; gl_FragColor = vec4(uColor, pow(1.0 - dist * 2.0, 2.5) * 0.8 * uOpacity); }`}
      />
    </points>
  );
};

/**
 * TwinklingStars: Thousands of tiny twinkling lights in the high atmosphere
 */
const TwinklingStars: React.FC<{ opacity: number; color: THREE.Color }> = ({ opacity, color }) => {
  // Reference for the twinkling material
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  // Generate massive star field on a large sphere
  const starData = useMemo(() => {
    const positions = new Float32Array(TWINKLING_STAR_COUNT * 3), phases = new Float32Array(TWINKLING_STAR_COUNT), sizes = new Float32Array(TWINKLING_STAR_COUNT);
    for (let i = 0; i < TWINKLING_STAR_COUNT; i++) {
      const r = 850 + Math.random() * 150, theta = 2 * Math.PI * Math.random(), phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = 1.0 + Math.random() * 2.5;
    }
    return { positions, phases, sizes };
  }, []);
  // shader uniforms
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 1.0 }, uColor: { value: new THREE.Color() } }), []);

  // Animation logic
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uOpacity.value = opacity;
      materialRef.current.uniforms.uColor.value.set(color);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={TWINKLING_STAR_COUNT} array={starData.positions} itemSize={3} />
        <bufferAttribute attach="attributes-aPhase" count={TWINKLING_STAR_COUNT} array={starData.phases} itemSize={1} />
        <bufferAttribute attach="attributes-aSize" count={TWINKLING_STAR_COUNT} array={starData.sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef} transparent depthWrite={false} uniforms={uniforms}
        vertexShader={`uniform float uTime; attribute float aPhase; attribute float aSize; varying float vAlpha; void main() { vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0); float twinkle = sin(uTime * (2.5 + aSize * 0.5) + aPhase); vAlpha = 0.6 + 0.4 * pow(0.5 + 0.5 * twinkle, 2.0); gl_PointSize = aSize * (700.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition; }`}
        fragmentShader={`uniform float uOpacity; uniform vec3 uColor; varying float vAlpha; void main() { float dist = distance(gl_PointCoord, vec2(0.5)); if (dist > 0.5) discard; float alpha = (1.0 - smoothstep(0.3, 0.5, dist)) * vAlpha * uOpacity; gl_FragColor = vec4(uColor, alpha); }`}
      />
    </points>
  );
};

/**
 * SkyGradient: The massive dome handling the background color transitions
 */
const SkyGradient: React.FC<{ atmosphere: THREE.Color; space: THREE.Color; horizon: THREE.Color }> = ({ atmosphere, space, horizon }) => {
  // Initialize uniforms for three-point gradient interpolation
  const uniforms = useMemo(() => ({ topColor: { value: new THREE.Color() }, midColor: { value: new THREE.Color() }, bottomColor: { value: new THREE.Color() }, offset: { value: 60 }, exponent: { value: 0.9 } }), []);

  // Perform smooth frame-by-frame color copying
  useFrame(() => {
    uniforms.topColor.value.copy(space); uniforms.midColor.value.copy(horizon); uniforms.bottomColor.value.copy(atmosphere);
  });

  return (
    <mesh>
      {/* Huge geometry to encompass the entire scene */}
      <sphereGeometry args={[900, 32, 32]} />
      {/* Render on the inside of the sphere */}
      <shaderMaterial side={THREE.BackSide} uniforms={uniforms}
        vertexShader={`varying vec3 vLocalPosition; void main() { vLocalPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`uniform vec3 topColor; uniform vec3 midColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vLocalPosition; void main() { vec3 pos = normalize(vLocalPosition); float h = pos.y; vec3 finalColor = h > 0.0 ? mix(midColor, topColor, pow(h, exponent)) : mix(midColor, bottomColor, pow(-h, exponent)); gl_FragColor = vec4(finalColor, 1.0); }`}
      />
    </mesh>
  );
};

/**
 * Environment: Orchestrator component for the light, fog, and celestial layers
 */
const Environment: React.FC<{
  scrollProgressRef?: React.MutableRefObject<number>;
  scrollProgress?: number;
  /** Called when the sky atmosphere color changes (for syncing plane layer text) */
  onSkyColorChange?: (hex: string) => void;
}> = ({ scrollProgressRef: scrollProgressRefProp, scrollProgress = 0, onSkyColorChange }) => {
  const fogRef = useRef<THREE.Fog>(null), ambLightRef = useRef<THREE.AmbientLight>(null);
  const fallbackScrollRef = useRef(0);
  const scrollProgressRef = scrollProgressRefProp ?? fallbackScrollRef;
  // Start with exactly 30 clouds; extra only after threshold; full clouds by end of scroll
  const normalizedScroll =
    scrollProgress <= FALL_CLOUD_SCROLL_THRESHOLD
      ? 0
      : (scrollProgress - FALL_CLOUD_SCROLL_THRESHOLD) / (1 - FALL_CLOUD_SCROLL_THRESHOLD);
  const buildup =
    normalizedScroll >= FULL_CLOUDS_FROM_NORMALIZED ? 1 : Math.pow(normalizedScroll, CLOUD_BUILDUP_EXPONENT);
  const extraClouds = Math.floor(buildup * EXTRA_CLOUD_COUNT);
  const cloudCount = CLOUD_COUNT + extraClouds; // 30 at start, up to 30 + 130 at end
  // State tracking the virtual clock (0 to 24 hours)
  const [timeOfDay, setTimeOfDay] = useState(0);

  // Time-scaling constant: how many real seconds for one full 24h cycle
  const cycleDuration = 180;
  // Start at 2 AM so stars are visible when the page first loads
  const cycleStartHour = 2;
  const cycleStartOffset = (cycleStartHour / 24) * cycleDuration;

  // Global simulation frame loop
  useFrame((state) => {
    // Calculate current cycle hour from the elapsed simulation time (start at night so stars show at load)
    const elapsed = state.clock.getElapsedTime();
    const currentHour = (((elapsed + cycleStartOffset) % cycleDuration) / cycleDuration) * 24;
    setTimeOfDay(currentHour);
    // Determine which themes to interpolate between for this hour
    const { target, blend, alpha } = getThemeState(currentHour);
    // lerp current fog color
    const fogColor = lerpColor(target.fog, blend.fog, alpha);
    // Apply interpolated values to scene objects
    if (fogRef.current) fogRef.current.color.copy(fogColor);
    if (ambLightRef.current) ambLightRef.current.intensity = THREE.MathUtils.lerp(target.ambient, blend.ambient, alpha);
  });

  // Derived theme attributes for celestial components (stars, clouds, motes)
  const themeData = useMemo(() => {
    const { target: t, blend: b, alpha: a } = getThemeState(timeOfDay);
    return {
      atmosphere: lerpColor(t.atmosphere, b.atmosphere, a),
      horizon: lerpColor(t.horizon, b.horizon, a),
      space: lerpColor(t.space, b.space, a),
      motes: lerpColor(t.motes, b.motes, a),
      cloud: lerpColor(t.cloud, b.cloud, a),
      starColor: lerpColor(t.starColor, b.starColor, a),
      // Lerp 3-component position array for the sun/moon light
      sunPos: t.sunPos.map((v, i) => THREE.MathUtils.lerp(v, b.sunPos[i], a)) as [number, number, number]
    };
  }, [timeOfDay]);

  // Notify parent of current atmosphere color so plane layer text can match the sky
  useEffect(() => {
    if (!onSkyColorChange) return;
    const hex = '#' + themeData.atmosphere.getHexString();
    onSkyColorChange(hex);
  }, [themeData, onSkyColorChange]);

  // Star visibility logic: stars fade out as the user scrolls — full at top, gone at end
  const STAR_OPACITY_MIN = 0.58;
  const starOpacity = useMemo(() => {
    let opacity: number;
    if (timeOfDay >= 6.0 && timeOfDay < 9.0) opacity = Math.pow(1.0 - (timeOfDay - 6.0) / 3.0, 2);
    else if (timeOfDay >= 9.0 && timeOfDay < 16.0) opacity = 0;
    else if (timeOfDay >= 16.0 && timeOfDay < 19.0) opacity = Math.pow((timeOfDay - 16.0) / 3.0, 2);
    else opacity = 1;
    const timeOpacity = Math.max(opacity, STAR_OPACITY_MIN);
    // Fade stars linearly as the user scrolls: 1 at scroll 0, 0 at scroll 1
    return timeOpacity * (1 - scrollProgress);
  }, [timeOfDay, scrollProgress]);

  // Aggregate all sky layers into a single JSX group
  return (
    <>
      {/* 1. Global background gradient */}
      <SkyGradient atmosphere={themeData.atmosphere} space={themeData.space} horizon={themeData.horizon} />
      {/* 2. Polar light curtains */}
      <Aurora timeOfDay={timeOfDay} />
      {/* 3. Static distant stars */}
      <BackgroundStars opacity={starOpacity} color={themeData.motes} />
      {/* 4. Tiny twinkling stars */}
      <TwinklingStars opacity={starOpacity} color={themeData.starColor} />
      {/* 5. Cinematic pulsing stars */}
      <PulsingStars opacity={starOpacity} color={themeData.starColor} />
      {/* 6. Volumetric noise clouds */}
      <Clouds color={themeData.cloud} scrollProgressRef={scrollProgressRef} cloudCount={cloudCount} />
      {/* 7. Foreground floating motes */}
      <AtmosphericMotes color={themeData.starColor} opacity={starOpacity} />
      {/* 8. Scene Lighting */}
      <ambientLight ref={ambLightRef} intensity={0.5} />
      <directionalLight position={[themeData.sunPos[0] * 100, themeData.sunPos[1] * 100, themeData.sunPos[2] * 100]} intensity={2.5} color="#fff5e6" />
      {/* 9. Depth fog for atmospheric perspective */}
      <fog ref={fogRef} attach="fog" args={['#000', 300, 2000]} />
    </>
  );
};

// Export Environment component
export default Environment;
