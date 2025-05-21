
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

// Componente para uma zona da fábrica que pode ser clicada
type FactoryZoneProps = {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  zoneName: string;
  onClick: (zone: string) => void;
  isHovered?: boolean;
};

const FactoryZone: React.FC<FactoryZoneProps> = ({ position, scale, color, zoneName, onClick, isHovered }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const actualHovered = isHovered !== undefined ? isHovered : hovered;
  
  // Animação simples para quando a zona é destacada
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(
        meshRef.current.scale.y,
        actualHovered ? scale[1] * 1.2 : scale[1],
        0.1
      );
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      onClick={() => onClick(zoneName)}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={actualHovered ? '#ffffff' : color} 
        emissive={actualHovered ? color : 'black'}
        emissiveIntensity={actualHovered ? 0.5 : 0}
      />
    </mesh>
  );
};

// Componente para a cena 3D completa
type FactoryModel3DProps = {
  onZoneClick: (zone: string) => void;
};

const FactoryModel3D: React.FC<FactoryModel3DProps> = ({ onZoneClick }) => {
  // Aqui você pode definir diferentes zonas da sua fábrica
  const factoryZones = [
    { name: 'Enchimento', position: [-2, 0, 0], scale: [1.5, 1, 1.5], color: '#3B82F6' },
    { name: 'Fabrico', position: [2, 0, 0], scale: [1.5, 1, 1.5], color: '#10B981' },
    { name: 'Expedição', position: [0, 0, 2], scale: [1.5, 1, 1.5], color: '#F59E0B' },
    { name: 'Armazém', position: [0, 0, -2], scale: [1.5, 1, 1.5], color: '#EF4444' }
  ];

  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-md">
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-5, 5, 5]} intensity={1} castShadow />
        
        {/* Base da fábrica */}
        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
        
        <group position={[0, 0, 0]}>
          {factoryZones.map((zone) => (
            <FactoryZone
              key={zone.name}
              position={zone.position as [number, number, number]}
              scale={zone.scale as [number, number, number]}
              color={zone.color}
              zoneName={zone.name}
              onClick={onZoneClick}
              isHovered={hoveredZone === zone.name}
            />
          ))}
          
          {/* Estrutura básica da fábrica */}
          <mesh position={[0, -0.5, 0]} castShadow>
            <boxGeometry args={[8, 0.2, 8]} />
            <meshStandardMaterial color="#d1d5db" />
          </mesh>
        </group>
        
        <PresentationControls
          global
          zoom={0.8}
          rotation={[0, -Math.PI / 4, 0]}
          polar={[0, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          <group position={[0, 0, 0]} />
        </PresentationControls>
        
        <OrbitControls enablePan={false} />
        <Environment preset="city" />
      </Canvas>
      
      <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded shadow-md">
        <p className="text-sm text-gray-600">Clique em uma área para ver os vídeos relacionados</p>
      </div>
    </div>
  );
};

export default FactoryModel3D;
