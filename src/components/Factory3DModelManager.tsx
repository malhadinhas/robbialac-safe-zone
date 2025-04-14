import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PresentationControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import ErrorBoundary from './ErrorBoundary';

// Loading spinner component
const LoadingSpinner = () => (
  <Html center>
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-robbialac"></div>
    </div>
  </Html>
);

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
  return (
    <group>
      {/* Base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>

      {/* Placeholder boxes for zones */}
      {Object.keys(zoneMeshMapping).map((zone, index) => {
        const x = (index % 3 - 1) * 2;
        const z = Math.floor(index / 3) * 2 - 1;
        
        return (
          <mesh
            key={zone}
            position={[x, 0.5, z]}
            onClick={() => onZoneClick(zone as FactoryZone)}
            onPointerOver={() => {
              setHoveredZone(zone as FactoryZone);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredZone(null);
              document.body.style.cursor = 'auto';
            }}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
              color={hoveredZone === zone ? zoneColors[zone as FactoryZone] : '#cccccc'}
              emissive={hoveredZone === zone ? zoneColors[zone as FactoryZone] : '#000000'}
              emissiveIntensity={hoveredZone === zone ? 0.5 : 0}
            />
            
            {/* Zone label */}
            <Html position={[0, 1, 0]} center>
              <div className="bg-white/80 px-2 py-1 rounded shadow text-sm font-medium">
                {zone}
              </div>
            </Html>
          </mesh>
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  // Carregar o modelo uma vez quando o componente montar
  const { scene, nodes } = useGLTF(FACTORY_MODEL_PATH);
  
  useEffect(() => {
    if (!scene || !nodes) {
      const error = new Error('Erro ao carregar modelo: scene ou nodes não disponíveis');
      setLoadError(error);
      onLoadError(error);
      return;
    }

    const zones = Object.keys(zoneMeshMapping) as FactoryZone[];
    
    // Atualizar materiais
    zones.forEach(zone => {
      const meshName = zoneMeshMapping[zone];
      if (nodes[meshName]) {
        if (nodes[meshName].material && !nodes[meshName].originalMaterial) {
          nodes[meshName].originalMaterial = nodes[meshName].material.clone();
        }
        
        const isHovered = hoveredZone === zone;
        if (isHovered) {
          nodes[meshName].material.emissive = new THREE.Color(zoneColors[zone]);
          nodes[meshName].material.emissiveIntensity = 0.8;
        } else if (nodes[meshName].originalMaterial) {
          nodes[meshName].material.emissive = nodes[meshName].originalMaterial.emissive;
          nodes[meshName].material.emissiveIntensity = nodes[meshName].originalMaterial.emissiveIntensity || 0;
        }
      }
    });

    setIsLoading(false);
  }, [scene, nodes, hoveredZone, onLoadError]);

  if (loadError) {
    return <FallbackModel onZoneClick={onZoneClick} hoveredZone={hoveredZone} setHoveredZone={setHoveredZone} />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  const model = scene.clone();
  const zones = Object.keys(zoneMeshMapping) as FactoryZone[];
    
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
        nodes[meshName].getWorldPosition(position);
        
        return (
          <group key={zone} position={position}>
            {/* Invisible clickable area */}
            <mesh
              visible={false}
              onClick={() => onZoneClick(zone)}
              onPointerOver={() => {
                setHoveredZone(zone);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredZone(null);
                document.body.style.cursor = 'auto';
              }}
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
};

// Component for the entire factory model with interactive zones
const Factory3DModelManager = ({ onZoneClick }: { onZoneClick: (zone: string) => void }) => {
  const [hoveredZone, setHoveredZone] = useState<FactoryZone | null>(null);
  const [modelError, setModelError] = useState<Error | null>(null);

  const handleLoadError = (error: Error) => {
    console.error('Erro ao carregar modelo da fábrica:', error);
    setModelError(error);
  };

  return (
    <div className="aspect-video bg-gray-100 rounded-md">
      <ErrorBoundary>
        <Canvas
          camera={{ position: [0, 180, 300], fov: 35 }}
          style={{ width: '100%', height: '100%' }}
        >
          <Suspense fallback={<LoadingSpinner />}>
            {/* Luzes básicas para iluminação */}
            <ambientLight intensity={0.8} />
            <directionalLight 
              position={[5, 5, 5]} 
              intensity={1} 
              castShadow 
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <hemisphereLight intensity={0.3} groundColor="#b9b9b9" />
            
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={true}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 3}
              minAzimuthAngle={-Math.PI}
              maxAzimuthAngle={Math.PI}
              target={[0, 0, 0]}
              rotateSpeed={0.5}
            />
            
            <group position={[0, -5, 0]} scale={1.2}>
              {!modelError && (
                <FactoryModel
                  onZoneClick={onZoneClick as (zone: FactoryZone) => void}
                  hoveredZone={hoveredZone}
                  setHoveredZone={setHoveredZone}
                  onLoadError={handleLoadError}
                />
              )}
              {modelError && (
                <FallbackModel 
                  onZoneClick={onZoneClick as (zone: FactoryZone) => void}
                  hoveredZone={hoveredZone}
                  setHoveredZone={setHoveredZone}
                />
              )}
            </group>
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};

export default Factory3DModelManager;
