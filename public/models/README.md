
# 3D Models

This folder is for storing 3D model files (.glb or .gltf) for the factory visualization.

## Required Models

For the factory visualization to work with real models instead of primitive shapes, you need to add the following files to this directory:

- `enchimento_zone.glb` - 3D model for the Enchimento (Filling) zone
- `fabrico_zone.glb` - 3D model for the Fabrico (Manufacturing) zone
- `expedicao_zone.glb` - 3D model for the Expedição (Shipping) zone
- `armazem_zone.glb` - 3D model for the Armazém (Warehouse) zone

## Model Requirements

For best performance:
- Keep file sizes under 5MB when possible
- Use optimized models with appropriate polygon count for web
- Include textures within the GLB file
- Use the GLB format (binary GLTF) rather than separate GLTF + assets

## Testing

Once you've added these files, the application will automatically load them instead of showing primitive shapes.
