# Segurança de Acesso aos Vídeos no Cloudflare R2

Este documento explica como configurar o acesso seguro aos vídeos armazenados no bucket Cloudflare R2 sem torná-lo público para todos na internet.

## Visão Geral da Solução

Nossa solução implementa URLs assinadas temporárias para acessar os vídeos, o que significa:

1. O bucket R2 permanece privado (não é acessível publicamente)
2. Apenas a aplicação pode gerar URLs temporárias para acessar os vídeos
3. As URLs expiram após um tempo determinado (padrão: 1 hora)
4. Apenas domínios autorizados podem acessar os recursos (via CORS)

## Configuração no Cloudflare R2

No painel do Cloudflare R2:

1. **NÃO ative o acesso público ao bucket**:

   - Mantenha "R2.dev subdomain" como "Not allowed"
   - Não configure domínios personalizados públicos

2. **Configure a política CORS manualmente no painel do Cloudflare**:

   a. Faça login no painel do Cloudflare

   b. Navegue até R2 > Buckets > workplace-safety-videos

   c. Clique em "Add CORS policy"

   d. Cole o seguinte código JSON na caixa de texto:

   ```json
   [
     {
       "AllowedOrigins": [
         "http://localhost:5173",
         "https://robbialac-seguranca.com"
       ],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   e. Clique em "Save"

## Como Funciona

1. **Armazenamento de Vídeos**:

   - Os vídeos são armazenados de forma privada no bucket R2
   - Apenas as chaves de API têm acesso direto ao bucket

2. **Geração de URLs Assinadas**:

   - Quando um usuário solicita um vídeo, a aplicação gera uma URL assinada temporária
   - Esta URL contém um token de autenticação que expira após o tempo configurado
   - Somente quem possui esta URL pode acessar o vídeo durante o período de validade

3. **Reprodução de Vídeos**:
   - O componente `HLSVideoPlayer` na aplicação utiliza estas URLs assinadas para reproduzir os vídeos
   - Quando a URL expira, a aplicação solicita uma nova automaticamente

## Configuração no Código

A solução já está implementada no código e inclui:

1. Geração de URLs assinadas em `src/services/cloudflareR2Service.ts`
2. Processamento seguro de vídeos em `server/services/videoProcessingService.ts`
3. Controle de acesso em `server/controllers/videoController.ts`

## Tempo de Expiração

O tempo de expiração das URLs assinadas pode ser configurado na variável de ambiente:

```
R2_URL_EXPIRATION=3600  # Tempo em segundos (padrão: 1 hora)
```

## Verificando a Segurança

Para verificar que o sistema está funcionando corretamente:

1. Tente acessar um vídeo diretamente pelo URL do bucket - deve ser negado
2. Acesse o vídeo através da aplicação - deve funcionar normalmente
3. Espere o tempo de expiração e verifique se a URL assinada expira corretamente

## Troubleshooting

Se encontrar problemas de acesso aos vídeos:

1. Verifique se as credenciais do R2 estão corretas no arquivo `.env`
2. Certifique-se de que a política CORS foi configurada corretamente no painel do Cloudflare
3. Verifique os cabeçalhos de resposta para erros CORS específicos usando as ferramentas de desenvolvedor do navegador
4. Consulte os logs da aplicação para identificar erros específicos

## Requisitos para as Credenciais da API

A chave de API para o Cloudflare R2 precisa ter pelo menos as seguintes permissões:

- `GetObject` - Para ler objetos do bucket
- `PutObject` - Para fazer upload de objetos
- `ListBucket` - Para listar objetos no bucket

Se você precisar também configurar a política CORS através da API, a chave também precisará de:

- `PutBucketCors` - Para configurar a política CORS

No painel do Cloudflare, você pode criar uma chave de API com essas permissões em:
R2 > Gerenciar R2 API Tokens > Create API Token

---

Para mais informações sobre como criar e gerenciar vídeos, consulte a documentação da API.
