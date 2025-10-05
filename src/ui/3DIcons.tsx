'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Box, Sphere, Cylinder, Torus } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// Lead generation icon - 3D target with arrows
const LeadTarget: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Main target circle */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
        <meshStandardMaterial color="#FF5A1F" />
      </mesh>
      
      {/* Inner circles */}
      <mesh position={[0, 0, 0.11]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
        <meshStandardMaterial color="#F5F5F5" />
      </mesh>
      
      <mesh position={[0, 0, 0.16]}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 32]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Arrows pointing inward */}
      {[...Array(4)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(i * Math.PI / 2) * 0.8,
            Math.sin(i * Math.PI / 2) * 0.8,
            0.05
          ]}
          rotation={[0, 0, i * Math.PI / 2]}
        >
          <coneGeometry args={[0.1, 0.3, 8]} />
          <meshStandardMaterial color="#FF5A1F" />
        </mesh>
      ))}
    </group>
  );
};

// Email icon - 3D envelope
const EmailIcon: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.15 : 1}
      >
        <boxGeometry args={[0.8, 0.6, 0.1]} />
        <meshStandardMaterial color="#F5F5F5" />
      </mesh>
      
      {/* Envelope flap */}
      <mesh position={[0, 0.2, 0.05]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.4, 0.05]} />
        <meshStandardMaterial color="#FF5A1F" />
      </mesh>
      
      {/* Mail lines */}
      <mesh position={[0, 0, 0.11]}>
        <boxGeometry args={[0.6, 0.02, 0.01]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      <mesh position={[0, -0.1, 0.11]}>
        <boxGeometry args={[0.4, 0.02, 0.01]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
};

// Analytics icon - 3D chart
const AnalyticsIcon: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  const bars = [
    { height: 0.3, x: -0.3, color: '#FF5A1F' },
    { height: 0.6, x: -0.1, color: '#F5F5F5' },
    { height: 0.4, x: 0.1, color: '#FF5A1F' },
    { height: 0.8, x: 0.3, color: '#F5F5F5' },
  ];

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        {/* Base */}
        <boxGeometry args={[0.8, 0.1, 0.2]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Chart bars */}
      {bars.map((bar, i) => (
        <mesh key={i} position={[bar.x, bar.height / 2 + 0.05, 0]}>
          <boxGeometry args={[0.15, bar.height, 0.15]} />
          <meshStandardMaterial color={bar.color} />
        </mesh>
      ))}
    </group>
  );
};

// Main 3D icons container
export interface ThreeDIconsProps {
  className?: string;
}

export const ThreeDIcons: React.FC<ThreeDIconsProps> = ({ className }) => {
  return (
    <div className={`w-full h-96 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[-10, -10, -10]} color="#FF5A1F" intensity={0.3} />
        
        <LeadTarget position={[-2, 0, 0]} />
        <EmailIcon position={[0, 0, 0]} />
        <AnalyticsIcon position={[2, 0, 0]} />
      </Canvas>
    </div>
  );
};

// Floating particles background
export const FloatingParticles: React.FC<{ count?: number }> = ({ count = 50 }) => {
  const particles = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (particles.current) {
      particles.current.rotation.y += 0.001;
      particles.current.rotation.x += 0.0005;
    }
  });

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#FF5A1F" transparent opacity={0.6} />
    </points>
  );
};
