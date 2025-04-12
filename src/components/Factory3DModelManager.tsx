
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PresentationControls, Environment, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

// Define available factory zones
export type FactoryZone = 'Enchimento' | 'Fabrico' | 'Robbialac' | 'MateriaPrima' | 'Expedicao' | 'TrafegoInferior' | 'TrafegoSuperior';

// Factory model path (relative to public folder)
const FACTORY_MODEL_PATH = '/models/Fabrica_v1.glb';

// Mapping of zone names to mesh names in the GLB file
const zoneMeshMapping: Record<FactoryZone, string> = {
  'Enchimento': '3D_PIN_ENCHIMENTO',
  'Fabrico': '3D_PIN_FABRICO',
  'Robbialac': '3D_ROBBIALAC',
  'MateriaPrima': '3D_PIN_MATERISPRIMAS',
  'Expedicao': '3D_PIN_EXPEDICAO',
  'TrafegoInferior': '3D_PIN_TRAFEGO_INFERIOR',
  'TrafegoSuperior': '3D_PIN_TRAFEGO_SUPERIOR'
};

// Mapping of zone names to colors (for highlighting)
const zoneColors: Record<FactoryZone, string> = {
  'Enchimento': '#3B82F6',
  'Fabrico': '#10B981',
  'Robbialac': '#EF4444',
  'MateriaPrima': '#F59E0B',
  'Expedicao': '#8B5CF6',
  'TrafegoInferior': '#EC4899',
  'TrafegoSuperior': '#06B6D4'
};

// Fallback component showing primitive shapes if model fails to load
const FallbackModel = ({ 
  onZoneClick, 
  hoveredZone, 
  setHoveredZone 
}: { 
  onZoneClick: (zone: FactoryZone) => void, 
  hoveredZone: FactoryZone | null, 
  setHoveredZone: (zone: FactoryZone | null) => void 
}) => {
  const zones = Object.keys(zoneColors) as FactoryZone[];
  
  return (
    <group>
      {/* Base floor */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      
      {/* Factory building representation */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8, 1, 5]} />
        <meshStandardMaterial color="#d4d4d8" />
      </mesh>
      
      {/* Create interactive zones */}
      {zones.map((zone, index) => {
        // Position zones in a circular pattern
        const totalZones = zones.length;
        const angle = (index / totalZones) * Math.PI * 2;
        const radius = 5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <group key={zone} position={[x, 0.5, z]}>
            {/* Zone indicator */}
            <mesh 
              onClick={() => onZoneClick(zone)}
              onPointerOver={() => {
                setHoveredZone(zone);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredZone(null);
                document.body.style.cursor = 'auto';
              }}
              scale={hoveredZone === zone ? [1, 1.2, 1] : [1, 1, 1]}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial 
                color={zoneColors[zone]} 
                emissive={hoveredZone === zone ? zoneColors[zone] : '#000000'}
                emissiveIntensity={hoveredZone === zone ? 0.5 : 0}
              />
            </mesh>
            
            {/* Zone label */}
            <Html position={[0, 1.5, 0]} center>
              <div className="bg-white/80 px-2 py-1 rounded shadow text-sm font-medium">
                {zone}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// Component to load and display the factory model
const FactoryModel = ({ 
  onZoneClick,
  hoveredZone,
  setHoveredZone,
  onLoadError
}: { 
  onZoneClick: (zone: FactoryZone) => void,
  hoveredZone: FactoryZone | null,
  setHoveredZone: (zone: FactoryZone | null) => void,
  onLoadError: (error: Error) => void
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Use a try-catch block to handle loading errors
  try {
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
                <div className="bg-white/80 px-2 py-1 rounded shadow text-sm font-medium">
                  {zone}
                </div>
              </Html>
            </group>
          );
        })}
      </group>
    );
  } catch (error) {
    // Report loading error
    console.error('Error loading factory model:', error);
    onLoadError(error as Error);
    return null;
  }
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
  const [modelError, setModelError] = useState<Error | null>(null);
  
  const handleModelError = (error: Error) => {
    setModelError(error);
  };
  
  return (
    <div className={className + " relative"}>
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-5, 5, 5]} intensity={1} castShadow />
        
        <PresentationControls
          global
          zoom={0.8}
          rotation={[0, -Math.PI / 4, 0]}
          polar={[0, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          {!modelError ? (
            <FactoryModel 
              onZoneClick={onZoneClick as (zone: FactoryZone) => void} 
              hoveredZone={hoveredZone} 
              setHoveredZone={setHoveredZone}
              onLoadError={handleModelError}
            />
          ) : (
            <FallbackModel
              onZoneClick={onZoneClick as (zone: FactoryZone) => void}
              hoveredZone={hoveredZone}
              setHoveredZone={setHoveredZone}
            />
          )}
        </PresentationControls>
        
        <OrbitControls enablePan={false} />
        <Environment preset="city" />
      </Canvas>
      
      {modelError && (
        <div className="absolute top-4 left-4 bg-red-100 p-2 rounded shadow-md text-red-800 text-sm space-y-1 max-w-lg">
          <p className="font-medium">Erro ao carregar o modelo 3D. Usando representação simplificada.</p>
          <p className="text-xs">Verifique se o arquivo <code>/public/models/Fabrica_v1.glb</code> está presente.</p>
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded shadow-md">
        <p className="text-sm text-gray-600">Clique em uma área para ver os vídeos relacionados</p>
      </div>
    </div>
  );
};

// Remove preload since it's causing errors when the file doesn't exist
// Instead we'll handle errors directly in the component

export default Factory3DModelManager;
