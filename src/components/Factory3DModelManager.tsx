import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PresentationControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import ErrorBoundary from './ErrorBoundary';
import { useLocation } from 'react-router-dom';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'; // Importar o tipo para a ref
import { useIsCompactView } from '@/hooks/use-mobile';

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
  onLoadError,
  onModelCenterCalculated
}: { 
  onZoneClick: (zone: FactoryZone) => void,
  hoveredZone: FactoryZone | null,
  setHoveredZone: (zone: FactoryZone | null) => void,
  onLoadError: (error: Error) => void,
  onModelCenterCalculated: (center: THREE.Vector3) => void
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  // Carregar o modelo
  const { scene, nodes } = useGLTF(FACTORY_MODEL_PATH);
  
  // Calcular o centro do modelo quando a cena carregar
  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = new THREE.Vector3();
      box.getCenter(center);
      onModelCenterCalculated(center); 
      // console.log("Calculated model center:", center); // <-- Comentar este log
    }
  }, [scene, onModelCenterCalculated]); 

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
        if (nodes[meshName].material) { 
          if (!nodes[meshName].originalMaterial) {
            // Apenas clonar se o material original ainda não foi guardado
            try {
              nodes[meshName].originalMaterial = nodes[meshName].material.clone();
            } catch (cloneError) {
               console.error(`Erro ao clonar material para ${meshName}:`, cloneError);
               // Não podemos prosseguir com o hover effect se o clone falhar
               return; // Usar return em vez de continue
            }
          }
          
          const isHovered = hoveredZone === zone;
          if (isHovered) {
            nodes[meshName].material.emissive = new THREE.Color(zoneColors[zone]);
            nodes[meshName].material.emissiveIntensity = 0.8;
          } else if (nodes[meshName].originalMaterial) {
            // Restaurar apenas se o originalMaterial foi clonado com sucesso
            nodes[meshName].material.emissive = nodes[meshName].originalMaterial.emissive;
            nodes[meshName].material.emissiveIntensity = nodes[meshName].originalMaterial.emissiveIntensity || 0;
          }
        } else {
           // console.warn(`Nó encontrado ${meshName} não possui material.`); // <-- Comentar este aviso
        }
      }
    });

    setIsLoading(false);
  }, [scene, nodes, hoveredZone, loadError, onLoadError]);

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
      {/* Render the main factory model - Garantir que está descomentado */}
      <primitive object={model} />
      
      {/* Add interactive areas for each zone */}
      {zones.map(zone => {
        const meshName = zoneMeshMapping[zone];
        
        if (!nodes || !nodes[meshName]) {
          return null;
        }
        
        // Get the world position of the mesh
        const position = new THREE.Vector3();
        try {
           nodes[meshName].getWorldPosition(position);
        } catch (err) {
           return null; // Não renderizar se não conseguir a posição
        }
        
        return (
          <group key={zone} position={position}>
            {/* Esfera clicável: Invisível, tamanho normal */}
            <mesh
              visible={false} // Tornar invisível
              onClick={(e) => { 
                  onZoneClick(zone); 
              }}
              onPointerOver={(e) => {
                e.stopPropagation(); 
                setHoveredZone(zone);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredZone(null);
                document.body.style.cursor = 'auto';
              }}
            >
              {/* Restaurar tamanho original */}
              <sphereGeometry args={[8, 16, 16]} /> 
              {/* Material básico, não precisa ser transparente */}
              <meshBasicMaterial color="red" wireframe={false} /> 
            </mesh>
            
            {/* Label for the zone - Manter afastada e não interativa */}
             <Html position={[0, 10, 0]} center> 
              <div 
                className="bg-white/80 px-2 py-1 rounded shadow text-sm font-medium"
                style={{ pointerEvents: 'none' }} 
              >
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
const Factory3DModelManager = ({ 
  onZoneClick, 
  useSimpleView = false,
  enableControls = false,
  zoneStats = [],
  isLoading = false,
  className = ''
}: { 
  onZoneClick: (zone: string) => void,
  useSimpleView?: boolean,
  enableControls?: boolean,
  zoneStats?: any[],
  isLoading?: boolean,
  className?: string
}) => {
  const [hoveredZone, setHoveredZone] = useState<FactoryZone | null>(null);
  const [modelCenter, setModelCenter] = useState<THREE.Vector3>(new THREE.Vector3());
  const [hasError, setHasError] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isCompactView = useIsCompactView();

  const handleLoadError = (error: Error) => {
    console.error('Erro ao carregar modelo:', error);
    setHasError(true);
  };

  const handleModelCenterCalculated = (center: THREE.Vector3) => {
    setModelCenter(center);
  };

  if (hasError || useSimpleView) {
    return (
      <div className={`w-full h-full ${className}`}>
        <FallbackModel 
          onZoneClick={onZoneClick} 
          hoveredZone={hoveredZone} 
          setHoveredZone={setHoveredZone} 
        />
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <ErrorBoundary fallback={
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-sm text-gray-600">Erro ao renderizar o modelo 3D</p>
        </div>
      }>
        <Canvas
          camera={{ 
            position: [0, 250, 250],
            fov: 50,
            near: 0.1,
            far: 1000
          }}
          gl={{ 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
          }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          
          <Suspense fallback={<LoadingSpinner />}>
            <FactoryModel
              onZoneClick={onZoneClick}
              hoveredZone={hoveredZone}
              setHoveredZone={setHoveredZone}
              onLoadError={handleLoadError}
              onModelCenterCalculated={handleModelCenterCalculated}
            />
          </Suspense>

          {enableControls ? (
            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={!isCompactView}
              enableRotate={true}
              minDistance={250}
              maxDistance={250}
              target={modelCenter}
              minPolarAngle={55 * (Math.PI / 180)}
              maxPolarAngle={55 * (Math.PI / 180)}
              minAzimuthAngle={-Infinity}
              maxAzimuthAngle={Infinity}
            />
          ) : (
            <PresentationControls
              global={true}
              cursor={true}
              snap={false}
              speed={1}
              zoom={!isCompactView}
              rotation={[0, 0, 0]}
              polar={[55 * (Math.PI / 180), 55 * (Math.PI / 180)]}
              azimuth={[-Infinity, Infinity]}
            />
          )}
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};

export default Factory3DModelManager;
