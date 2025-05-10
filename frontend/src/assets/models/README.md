
# 3D Models Folder

This folder contains all 3D models used in the Robbialac Security application.

## Model Formats

- Supported formats: GLTF/GLB (recommended), OBJ, FBX
- Recommended format is GLB as it's a binary format that includes textures

## Guidelines for 3D Models

1. Keep model size under 5MB when possible
2. Use appropriate level of detail (LOD) for web applications
3. Use proper naming conventions: `area_name_model.glb` (e.g., `enchimento_zone.glb`)
4. Include a thumbnail image with the same name as the model (e.g., `enchimento_zone.png`)

## Usage in Code

Models from this folder can be used with the GLTFModel component:

```tsx
import GLTFModel from '@/components/GLTFModel';

// Inside a component
<GLTFModel 
  modelPath="/src/assets/models/enchimento_zone.glb"
  scale={[1, 1, 1]}
  position={[0, 0, 0]}
  rotation={[0, 0, 0]}
/>
```

## Loading Models with useGLTF

To preload models for better performance, use:

```tsx
import { useGLTF } from '@react-three/drei';

// Preload models (place at the end of your component file)
useGLTF.preload('/src/assets/models/enchimento_zone.glb');
```
