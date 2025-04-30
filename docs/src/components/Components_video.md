# Componentes de Vídeo

## Visão Geral

Este documento descreve o componente principal de miniatura de vídeo da aplicação, responsável por buscar, validar e exibir imagens de miniatura (thumbnails) de vídeos de forma segura e eficiente.

---

## 1. VideoThumbnail

### Visão Geral

Componente que exibe a miniatura (thumbnail) de um vídeo, buscando a imagem de forma segura via URL assinada (Cloudflare R2), com tratamento de loading e erros.

### Funcionalidades

- Busca de URL segura para a miniatura via serviço externo
- Exibição da imagem da miniatura do vídeo
- Placeholder de loading (skeleton) enquanto carrega
- Placeholder de erro caso a miniatura não esteja disponível
- Tratamento de erros e logs para debugging
- Atualização automática ao mudar a chave da miniatura

### Estado e Gestão

```typescript
const [signedUrl, setSignedUrl] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(true);
const [error, setError] = useState<boolean>(false);
```

### Integrações

- `videoService` para obtenção da URL segura (getSecureR2Url)
- `logger` para logging de erros e avisos
- Componentes UI: Skeleton (placeholder de loading)

---

## Integrações Comuns

- Serviços de backend/cloud para geração de URLs seguras
- Componentes de UI reutilizáveis para consistência visual
- Logging centralizado para debugging

---

## Boas Práticas Implementadas

- Cleanup do efeito para evitar setState em componente desmontado
- Placeholder visual para loading e erro
- Logging detalhado para facilitar troubleshooting
- Uso de crossOrigin para evitar problemas de CORS
- Atualização automática ao mudar a chave da miniatura

---

## Possíveis Melhorias

- Suporte a diferentes tamanhos de miniatura
- Placeholder visual customizado (imagem padrão)
- Animações de fade-in ao carregar a imagem
- Suporte a fallback para múltiplas tentativas de fetch
- Acessibilidade aprimorada (alt dinâmico, aria-label)

---

## Considerações de Segurança

1. **URLs Seguras**
   - Garantir que apenas URLs assinadas sejam usadas para exibir imagens
2. **CORS**
   - Uso de crossOrigin para evitar problemas de acesso
3. **UX**
   - Placeholder claro para evitar confusão do utilizador

</rewritten_file>
