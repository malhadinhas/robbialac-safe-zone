
import React, { useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { GroupProps } from '@react-three/fiber';

type GLTFModelProps = {
  modelPath: string;
  scale?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
} & GroupProps;

// Este componente pode ser usado para carregar modelos GLTF/GLB reais
const GLTFModel: React.FC<GLTFModelProps> = ({ 
  modelPath, 
  scale = [1, 1, 1], 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  ...props 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  
  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale} {...props}>
      <primitive object={scene} />
    </group>
  );
};

export default GLTFModel;

// Para pré-carregar um modelo específico:
// useGLTF.preload('/path/to/model.glb');
