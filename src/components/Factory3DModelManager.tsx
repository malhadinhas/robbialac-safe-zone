
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PresentationControls, Environment, useGLTF } from '@react-three/drei';
import GLTFModel from './GLTFModel';

// Define available factory zones
export type FactoryZone = 'Enchimento' | 'Fabrico' | 'Expedição' | 'Armazém';

// Mapping of zone names to model paths (relative to public folder)
const zoneModelPaths: Record<FactoryZone, string> = {
  'Enchimento': '/models/enchimento_zone.glb', // These paths will be examples until real models are added
  'Fabrico': '/models/fabrico_zone.glb',
  'Expedição': '/models/expedicao_zone.glb',
  'Armazém': '/models/armazem_zone.glb'
};

// Mapping of zone names to colors (for highlighting)
const zoneColors: Record<FactoryZone, string> = {
  'Enchimento': '#3B82F6',
  'Fabrico': '#10B981',
  'Expedição': '#F59E0B',
  'Armazém': '#EF4444'
};

// Component for the entire factory model with interactive zones
type Factory3DModelManagerProps = {
  onZoneClick: (zone: string) => void;
  className?: string;
};

const Factory3DModelManager: React.FC<Factory3DModelManagerProps> = ({ 
  onZoneClick, 
  className = "w-full h-[500px] bg-gray-100 rounded-md" 
}) => {
  const [hoveredZone, setHoveredZone] = useState<FactoryZone | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Check if 3D models are available (fall back to primitive shapes if not)
  useEffect(() => {
    const checkIfModelsExist = async () => {
      try {
        // Try to fetch one model as a test
        const response = await fetch(zoneModelPaths.Enchimento);
        setModelsLoaded(response.ok);
      } catch (error) {
        console.log('3D models not available, using primitive shapes');
        setModelsLoaded(false);
      }
    };

    checkIfModelsExist();
  }, []);

  // Factory zone component that uses GLTFModel if available
  const FactoryZoneModel = ({ zone, isHovered }: { zone: FactoryZone, isHovered: boolean }) => {
    const handleZoneClick = () => onZoneClick(zone);
    const handlePointerOver = () => setHoveredZone(zone);
    const handlePointerOut = () => setHoveredZone(null);
    
    // Position each zone model in different areas
    const getZonePosition = (zone: FactoryZone): [number, number, number] => {
      switch (zone) {
        case 'Enchimento': return [-2, 0, 0];
        case 'Fabrico': return [2, 0, 0];
        case 'Expedição': return [0, 0, 2];
        case 'Armazém': return [0, 0, -2];
      }
    };

    return (
      <group 
        onClick={handleZoneClick} 
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        position={getZonePosition(zone)}
        scale={[1, isHovered ? 1.1 : 1, 1]}
        // Remove the cursor property as it's not supported on GroupProps
      >
        {modelsLoaded ? (
          <GLTFModel 
            modelPath={zoneModelPaths[zone]}
            scale={[1, 1, 1]}
            position={[0, 0, 0]}
          />
        ) : (
          // Fallback to colored box if model not available
          <mesh>
            <boxGeometry args={[1.5, 1, 1.5]} />
            <meshStandardMaterial 
              color={isHovered ? '#ffffff' : zoneColors[zone]} 
              emissive={isHovered ? zoneColors[zone] : 'black'}
              emissiveIntensity={isHovered ? 0.5 : 0}
            />
          </mesh>
        )}
        {/* Zone label */}
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-white/80 px-2 py-1 rounded shadow text-sm">{zone}</div>
        </Html>
      </group>
    );
  };

  // Html component for labels
  const Html: React.FC<{ position: [number, number, number], center?: boolean, children: React.ReactNode }> = ({ 
    position, 
    center = false, 
    children 
  }) => {
    return (
      <group position={position}>
        <mesh visible={false}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial />
        </mesh>
        <div 
          className={`html ${center ? 'transform -translate-x-1/2 -translate-y-1/2' : ''}`}
          style={{
            position: 'absolute',
            fontSize: '14px',
            pointerEvents: 'none'
          }}
        >
          {children}
        </div>
      </group>
    );
  };

  const zones: FactoryZone[] = ['Enchimento', 'Fabrico', 'Expedição', 'Armazém'];

  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-5, 5, 5]} intensity={1} castShadow />
        
        {/* Base floor */}
        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
        
        {/* Factory foundation */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[8, 0.2, 8]} />
          <meshStandardMaterial color="#d1d5db" />
        </mesh>
        
        {/* Render all zones */}
        {zones.map((zone) => (
          <FactoryZoneModel 
            key={zone} 
            zone={zone} 
            isHovered={hoveredZone === zone} 
          />
        ))}
        
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

// Preload models
Object.values(zoneModelPaths).forEach(path => {
  try {
    useGLTF.preload(path);
  } catch (error) {
    console.log(`Could not preload model: ${path}`);
  }
});

export default Factory3DModelManager;
