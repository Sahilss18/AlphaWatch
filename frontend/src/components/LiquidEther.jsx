import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export function LiquidEther({
  colors = ['#5227FF', '#FF9FFC', '#B497CF'],
  mouseForce = 20,
  cursorSize = 100,
  isViscous = true,
  viscous = 30,
  iterationsViscous = 32,
  iterationsPoisson = 32,
  resolution = 0.5,
  isBounce = false,
  autoDemo = true,
  autoSpeed = 0.5,
  autoIntensity = 2.2,
  takeoverDuration = 0.25,
  autoResumeDelay = 3000,
  autoRampDuration = 0.6,
  color0 = '#5227FF',
  color1 = '#FF9FFC',
  color2 = '#B497CF',
  className = '',
  style = {},
  children,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId;
    let renderer, scene, camera, material, mesh;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;

    const c0 = new THREE.Color(color0 || colors[0] || '#5227FF');
    const c1 = new THREE.Color(color1 || colors[1] || '#FF9FFC');
    const c2 = new THREE.Color(color2 || colors[2] || '#B497CF');

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * (resolution || 1));

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uMouseForce;
        uniform float uCursorSize;
        uniform vec3 uColor0;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uAutoSpeed;
        uniform float uAutoIntensity;
        varying vec2 vUv;

        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                   -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec2 st = gl_FragCoord.xy / uResolution.xy;
          float aspect = uResolution.x / uResolution.y;
          vec2 st_aspect = vec2(st.x * aspect, st.y);

          float t = uTime * uAutoSpeed * 0.45;

          vec2 q = vec2(0.0);
          q.x = snoise(st_aspect * 1.8 + vec2(t * 0.5, t * 0.3));
          q.y = snoise(st_aspect * 1.8 + vec2(t * 0.4, -t * 0.6));

          vec2 r = vec2(0.0);
          r.x = snoise(st_aspect * 2.5 + 1.2 * q + vec2(1.7, 9.2) + 0.15 * t);
          r.y = snoise(st_aspect * 2.5 + 1.2 * q + vec2(8.3, 2.8) + 0.126 * t);

          float f = snoise(st_aspect * 1.5 + 2.0 * r + t * 0.2);
          f = (f + 1.0) * 0.5;

          vec2 mouseAspect = vec2(uMouse.x * aspect, uMouse.y);
          float dist = distance(st_aspect, mouseAspect);
          float mouseRadius = (uCursorSize / uResolution.y) * 1.5;
          float mouseEffect = smoothstep(mouseRadius, 0.0, dist) * (uMouseForce / 20.0);

          f += mouseEffect * 0.6;
          f = clamp(f, 0.0, 1.0);

          vec3 col = mix(uColor0, uColor1, clamp(f * f * 3.5, 0.0, 1.0));
          col = mix(col, uColor2, clamp(length(q) * 1.1, 0.0, 1.0));
          col = mix(col, uColor1, clamp(length(r.x), 0.0, 1.0) * 0.7);

          float alpha = smoothstep(0.05, 0.95, f) * 0.55;
          float vignette = 1.0 - smoothstep(0.4, 1.5, length(st - 0.5) * 1.4);
          alpha *= vignette;

          gl_FragColor = vec4(col * (0.85 + uAutoIntensity * 0.15), alpha);
        }
      `;

      const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: new THREE.Vector2(-10, -10) },
        uMouseForce: { value: mouseForce },
        uCursorSize: { value: cursorSize },
        uColor0: { value: c0 },
        uColor1: { value: c1 },
        uColor2: { value: c2 },
        uAutoSpeed: { value: autoSpeed },
        uAutoIntensity: { value: autoIntensity },
      };

      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        blending: THREE.NormalBlending,
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      let targetMouse = new THREE.Vector2(0.5, 0.5);
      let currentMouse = new THREE.Vector2(0.5, 0.5);
      let lastMoveTime = Date.now();

      const handlePointerMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
        const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
        
        targetMouse.x = (clientX - rect.left) / rect.width;
        targetMouse.y = 1.0 - (clientY - rect.top) / rect.height;
        lastMoveTime = Date.now();
      };

      window.addEventListener('mousemove', handlePointerMove, { passive: true });
      window.addEventListener('touchmove', handlePointerMove, { passive: true });

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width || window.innerWidth;
          const h = entry.contentRect.height || 600;
          if (w > 0 && h > 0 && renderer) {
            renderer.setSize(w, h);
            uniforms.uResolution.value.set(w, h);
          }
        }
      });
      resizeObserver.observe(container);

      const startTime = performance.now();
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const now = performance.now();
        const elapsed = (now - startTime) * 0.001;
        uniforms.uTime.value = elapsed;

        const isIdle = Date.now() - lastMoveTime > (autoResumeDelay || 3000);
        if (autoDemo && isIdle) {
          const orbitTime = elapsed * (autoSpeed || 0.5) * 1.5;
          targetMouse.x = 0.5 + 0.35 * Math.sin(orbitTime) * Math.cos(orbitTime * 0.7);
          targetMouse.y = 0.5 + 0.3 * Math.cos(orbitTime * 1.2);
        }

        currentMouse.lerp(targetMouse, takeoverDuration || 0.1);
        uniforms.uMouse.value.copy(currentMouse);

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('touchmove', handlePointerMove);
        resizeObserver.disconnect();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    } catch (err) {
      console.warn('WebGL LiquidEther initialization skipped:', err);
    }
  }, [
    colors,
    mouseForce,
    cursorSize,
    isViscous,
    viscous,
    iterationsViscous,
    iterationsPoisson,
    resolution,
    isBounce,
    autoDemo,
    autoSpeed,
    autoIntensity,
    takeoverDuration,
    autoResumeDelay,
    autoRampDuration,
    color0,
    color1,
    color2,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%', ...style }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />
      {children && <div className="relative z-10 pointer-events-auto">{children}</div>}
    </div>
  );
}

export default LiquidEther;
