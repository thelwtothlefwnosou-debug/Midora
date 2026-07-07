"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Stars } from "@react-three/drei";
import * as THREE from "three";

function FloatingArchitecture({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mouse.current.x * 0.4 + t * 0.08,
      0.04
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      mouse.current.y * 0.15,
      0.04
    );
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.8}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.2, 2.8, 2.2]} />
          <MeshTransmissionMaterial
            backside
            samples={8}
            thickness={0.4}
            chromaticAberration={0.15}
            anisotropy={0.3}
            distortion={0.2}
            distortionScale={0.3}
            temporalDistortion={0.1}
            iridescence={0.4}
            iridescenceIOR={1}
            color="#c9a962"
            roughness={0.1}
            transmission={0.95}
          />
        </mesh>
      </Float>

      <Float speed={2} rotationIntensity={0.4} floatIntensity={1.2}>
        <mesh position={[2.5, 0.8, -1]}>
          <boxGeometry args={[1.4, 1.8, 1.4]} />
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.9}
            roughness={0.15}
            emissive="#c9a962"
            emissiveIntensity={0.15}
          />
        </mesh>
      </Float>

      <Float speed={1.8} rotationIntensity={0.3} floatIntensity={1}>
        <mesh position={[-2.2, -0.5, 0.5]}>
          <boxGeometry args={[1.6, 1.2, 1.6]} />
          <meshStandardMaterial
            color="#0f3460"
            metalness={0.7}
            roughness={0.2}
            transparent
            opacity={0.85}
          />
        </mesh>
      </Float>

      <Float speed={2.2} rotationIntensity={0.5} floatIntensity={0.6}>
        <mesh position={[0.5, 2.2, -2]}>
          <sphereGeometry args={[0.55, 32, 32]} />
          <MeshTransmissionMaterial
            color="#e8d5a3"
            transmission={0.98}
            thickness={0.2}
            roughness={0}
          />
        </mesh>
      </Float>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <torusGeometry args={[3.5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#c9a962" transparent opacity={0.35} />
      </mesh>

      <mesh rotation={[Math.PI / 3, 0.5, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[4.2, 0.015, 16, 100]} />
        <meshBasicMaterial color="#4ecdc4" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function seededUnit(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function ParticleField() {
  const count = 120;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seededUnit(i * 3 + 1) - 0.5) * 20;
      pos[i * 3 + 1] = (seededUnit(i * 3 + 2) - 0.5) * 20;
      pos[i * 3 + 2] = (seededUnit(i * 3 + 3) - 0.5) * 20;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#c9a962" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function SceneContent({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} color="#fff5e6" />
      <pointLight position={[-5, 5, -5]} intensity={2} color="#c9a962" />
      <pointLight position={[5, -3, 5]} intensity={1.5} color="#4ecdc4" />
      <Stars radius={50} depth={50} count={2000} factor={3} saturation={0.2} fade speed={0.5} />
      <ParticleField />
      <FloatingArchitecture mouse={mouse} />
    </>
  );
}

export function HeroScene() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouse.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouse.current.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <SceneContent mouse={mouse} />
      </Canvas>
    </div>
  );
}
