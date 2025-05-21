
# 3D Modelo da Fábrica

Este diretório contém o modelo 3D da fábrica utilizado na visualização interativa.

## Modelo Principal

Para que a visualização da fábrica funcione corretamente, você precisa adicionar o seguinte arquivo neste diretório:

- `Fabrica_v1.glb` - Modelo 3D completo da fábrica

## Meshes Interativas

O modelo `Fabrica_v1.glb` deve conter as seguintes meshes que serão usadas para interação:

- `3D_PIN_ENCHIMENTO` - Identifica a zona de Enchimento
- `3D_PIN_FABRICO` - Identifica a zona de Fabrico 
- `3D_ROBBIALAC` - Identifica a zona principal Robbialac
- `3D_PIN_MATERISPRIMAS` - Identifica a zona de Matérias-Primas
- `3D_PIN_EXPEDICAO` - Identifica a zona de Expedição
- `3D_PIN_TRAFEGO_INFERIOR` - Identifica a zona de Tráfego Inferior
- `3D_PIN_TRAFEGO_SUPERIOR` - Identifica a zona de Tráfego Superior

## Requisitos do Modelo

Para melhor performance:
- Mantenha o tamanho do arquivo abaixo de 5MB quando possível
- Use um modelo otimizado com número apropriado de polígonos para web
- Inclua texturas dentro do arquivo GLB
- Use o formato GLB (GLTF binário) em vez de GLTF + assets separados

## Extensibilidade

A estrutura do código permite adicionar mais zonas interativas no futuro. Você só precisará:
1. Adicionar as novas meshes no modelo GLB
2. Atualizar o código para reconhecer as novas zonas

## Teste

Após adicionar este arquivo, a aplicação irá automaticamente carregá-lo e tornar suas meshes interativas.

## Temporariamente sem modelo?

Se você estiver visualizando a aplicação sem o modelo 3D presente, será exibida uma visualização simplificada com representações básicas das zonas da fábrica até que o modelo real esteja disponível.
