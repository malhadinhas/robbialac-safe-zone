
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PresentationControls, Environment, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

// Define available factory zones
export type FactoryZone = 'Enchimento' | 'Fabrico' | 'Robbialac';

// Factory model path (relative to public folder)
const FACTORY_MODEL_PATH = '/models/Fabrica_v1.glb';

// Mapping of zone names to mesh names in the GLB file
const zoneMeshMapping: Record<FactoryZone, string> = {
  'Enchimento': '3D_PIN_ENCHIMENTO',
  'Fabrico': '3D_PIN_FABRICO',
  'Robbialac': '3D_ROBBIALAC'
};

// Mapping of zone names to colors (for highlighting)
const zoneColors: Record<FactoryZone, string> = {
  'Enchimento': '#3B82F6',
  'Fabrico': '#10B981',
  'Robbialac': '#EF4444'
};

// Component to load and display the factory model
const FactoryModel = ({ 
  onZoneClick,
  hoveredZone,
  setHoveredZone
}: { 
  onZoneClick: (zone: string) => void,
  hoveredZone: FactoryZone | null,
  setHoveredZone: (zone: FactoryZone | null) => void
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, nodes } = useGLTF(FACTORY_MODEL_PATH) as any;
  const zones = Object.keys(zoneMeshMapping) as FactoryZone[];
  
  // Clone the scene to avoid modification issues
  const model = scene.clone();
  
  // Effect for highlighting zones
  useFrame(() => {
    if (!nodes) return;
    
    // Reset all materials to original state
    zones.forEach(zone => {
      const meshName = zoneMeshMapping[zone];
      if (nodes[meshName]) {
        if (nodes[meshName].material && !nodes[meshName].originalMaterial) {
          // Store original material for later restoration
          nodes[meshName].originalMaterial = nodes[meshName].material.clone();
        }
        
        const isHovered = hoveredZone === zone;
        if (isHovered) {
          // Highlight hovered zone
          nodes[meshName].material.emissive = new THREE.Color(zoneColors[zone]);
          nodes[meshName].material.emissiveIntensity = 0.8;
        } else if (nodes[meshName].originalMaterial) {
          // Restore original material
          nodes[meshName].material.emissive = nodes[meshName].originalMaterial.emissive;
          nodes[meshName].material.emissiveIntensity = nodes[meshName].originalMaterial.emissiveIntensity || 0;
        }
      }
    });
  });
  
  // Handle zone interactions
  const handleZoneClick = (zone: FactoryZone) => () => {
    onZoneClick(zone);
  };
  
  const handlePointerOver = (zone: FactoryZone) => () => {
    setHoveredZone(zone);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    setHoveredZone(null);
    document.body.style.cursor = 'auto';
  };
  
  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      {/* Render the main factory model */}
      <primitive object={model} />
      
      {/* Add interactive areas for each zone */}
      {zones.map(zone => {
        const meshName = zoneMeshMapping[zone];
        if (!nodes || !nodes[meshName]) return null;
        
        // Get the world position of the mesh
        const position = new THREE.Vector3();
        if (nodes[meshName].getWorldPosition) {
          nodes[meshName].getWorldPosition(position);
        } else {
          // Fallback if getWorldPosition is not available
          position.copy(nodes[meshName].position);
        }
        
        return (
          <group key={zone} position={position}>
            {/* Invisible clickable area */}
            <mesh
              visible={false}
              onClick={handleZoneClick(zone)}
              onPointerOver={handlePointerOver(zone)}
              onPointerOut={handlePointerOut}
            >
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
            
            {/* Label for the zone */}
            <Html position={[0, 1, 0]} center>
              <div className="bg-white/80 px-2 py-1 rounded shadow text-sm">
                {zone}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
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
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  
  // Attempt to load the model
  useEffect(() => {
    const checkIfModelExists = async () => {
      try {
        const response = await fetch(FACTORY_MODEL_PATH);
        setModelLoaded(response.ok);
        if (!response.ok) {
          setModelError(true);
          console.error('Failed to load factory model:', await response.text());
        }
      } catch (error) {
        console.error('Error loading factory 3D model:', error);
        setModelError(true);
        setModelLoaded(false);
      }
    };
    
    checkIfModelExists();
  }, []);
  
  // Fallback component showing primitive shapes if model fails to load
  const FallbackModel = () => {
    const zones: FactoryZone[] = ['Enchimento', 'Fabrico', 'Robbialac'];
    
    return (
      <>
        {zones.map((zone, index) => {
          const angle = (index / zones.length) * Math.PI * 2;
          const radius = 2;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          return (
            <group 
              key={zone}
              position={[x, 0, z]}
              onClick={() => onZoneClick(zone)}
              onPointerOver={() => setHoveredZone(zone)}
              onPointerOut={() => setHoveredZone(null)}
            >
              <mesh scale={[1, hoveredZone === zone ? 1.2 : 1, 1]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial 
                  color={hoveredZone === zone ? '#ffffff' : zoneColors[zone]}
                  emissive={hoveredZone === zone ? zoneColors[zone] : 'black'}
                  emissiveIntensity={hoveredZone === zone ? 0.5 : 0}
                />
              </mesh>
              <Html position={[0, 1.5, 0]} center>
                <div className="bg-white/80 px-2 py-1 rounded shadow text-sm">{zone}</div>
              </Html>
            </group>
          );
        })}
      </>
    );
  };
  
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
        
        <PresentationControls
          global
          zoom={0.8}
          rotation={[0, -Math.PI / 4, 0]}
          polar={[0, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          {modelLoaded && !modelError ? (
            <FactoryModel 
              onZoneClick={onZoneClick} 
              hoveredZone={hoveredZone} 
              setHoveredZone={setHoveredZone} 
            />
          ) : (
            <FallbackModel />
          )}
        </PresentationControls>
        
        <OrbitControls enablePan={false} />
        <Environment preset="city" />
      </Canvas>
      
      {modelError && (
        <div className="absolute top-4 left-4 bg-red-100 p-2 rounded shadow-md text-red-800 text-sm">
          <p>Erro ao carregar o modelo 3D. Usando representação simplificada.</p>
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded shadow-md">
        <p className="text-sm text-gray-600">Clique em uma área para ver os vídeos relacionados</p>
      </div>
    </div>
  );
};

// Try to preload the model
try {
  useGLTF.preload(FACTORY_MODEL_PATH);
} catch (error) {
  console.error("Failed to preload factory model:", error);
}

export default Factory3DModelManager;
