"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function GoldenRings() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {[2, 2.8, 3.6].map((radius, i) => (
        <Float key={radius} speed={1 + i * 0.3} floatIntensity={0.5}>
          <mesh rotation={[Math.PI / 2 + i * 0.3, i * 0.5, 0]}>
            <torusGeometry args={[radius, 0.03, 16, 64]} />
            <meshBasicMaterial
              color={i === 0 ? "#c9a962" : i === 1 ? "#4ecdc4" : "#e8d5a3"}
              transparent
              opacity={0.25 - i * 0.05}
            />
          </mesh>
        </Float>
      ))}

      <Float speed={1.5} floatIntensity={0.8}>
        <mesh>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial
            color="#c9a962"
            wireframe
            emissive="#c9a962"
            emissiveIntensity={0.3}
          />
        </mesh>
      </Float>
    </group>
  );
}

export function HostScene() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }} gl={{ alpha: true }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#c9a962" />
      <GoldenRings />
    </Canvas>
  );
}
