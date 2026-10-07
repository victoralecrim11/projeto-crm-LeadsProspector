# Guia de configuração local do SearXNG para o ProspectorCRM

Este guia descreve como executar uma instância local, auto-hospedada e orientada à privacidade do SearXNG usando Docker para a **Fase B.3: Pesquisa Dinâmica de Design**.

---

## 1. Visão geral

O ProspectorCRM usa o **SearXNG** como provedor de busca principal, em regime de melhor esforço, para descobrir referências públicas de design por nicho (por exemplo, *dentistry*, *restaurant* e *barbershop*).

Principais características operacionais:

- **Sem custo de API:** solução totalmente gratuita e de código aberto.
- **Privacidade em primeiro lugar:** remove rastreamento de usuários; o CRM nunca envia nomes, endereços ou telefones de leads ao mecanismo de busca.
- **Fallback resiliente:** se o SearXNG não estiver em execução, o CRM registra automaticamente `SEARCH_PROVIDER_NOT_CONFIGURED` ou `UPSTREAM_ERROR`, ativa o Brave Search quando configurado ou usa as famílias de referência curadas (`pilotFamilies`) sem interromper a geração do site.

---

## 2. Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução.
- Porta `8080` disponível em `localhost`.

---

## 3. Início rápido (Docker Run)

Execute o contêiner oficial do SearXNG com a saída no formato JSON habilitada:

```bash
docker run -d \
  --name searxng \
  -p 8080:8080 \
  -e SEARXNG_BASE_URL=http://localhost:8080/ \
  -e SEARXNG_SECRET=u4a9c8f1e2d3b4a5f6e7d8c9b0a1f2e3d4 \
  searxng/searxng:latest
```

---

## 4. Configuração com Docker Compose (recomendada para desenvolvimento)

Crie um arquivo `docker-compose.searxng.yml`:

```yaml
version: '3.8'

services:
  searxng:
    image: searxng/searxng:latest
    container_name: prospector-searxng
    ports:
      - "8080:8080"
    volumes:
      - ./searxng-config:/etc/searxng:rw
    environment:
      - SEARXNG_BASE_URL=http://localhost:8080/
      - SEARXNG_SECRET=prospectorcrm_dev_secret_key_32chars_long
    restart: unless-stopped
```

### Habilitar a saída JSON em `settings.yml`

Confirme que `/etc/searxng/settings.yml` contém o formato JSON ativo entre os formatos de busca:

```yaml
search:
  formats:
    - html
    - json
```

Inicie o serviço:

```bash
docker compose -f docker-compose.searxng.yml up -d
```

---

## 5. Verificar a instalação

Teste se o SearXNG retorna os resultados da consulta em JSON:

```bash
curl "http://localhost:8080/search?q=barbearia+design+brasil&format=json"
```

A resposta esperada contém:

```json
{
  "query": "barbearia design brasil",
  "results": [
    {
      "url": "https://...",
      "title": "...",
      "content": "..."
    }
  ]
}
```

---

## 6. Configurar o ProspectorCRM

Adicione ou atualize o arquivo `.env` na raiz do projeto:

```env
# Provedor de busca principal da Pesquisa Dinâmica de Design
SEARXNG_URL=http://localhost:8080

# Provedor de fallback opcional (se o SearXNG estiver indisponível)
BRAVE_SEARCH_API_KEY=

# TTL do cache de snapshots (em dias; o padrão é 60)
DESIGN_RESEARCH_TTL_DAYS=60
```

---

## 7. Solução de problemas operacionais

| Sintoma | Causa | Resolução |
| :--- | :--- | :--- |
| `HTTP 403 / 429` | Instância pública do SearXNG bloqueando requisições JSON automatizadas | Use um contêiner Docker local e privado, não instâncias públicas. |
| `SearchProviderError: NOT_CONFIGURED` | `SEARXNG_URL` ausente no `.env` | Defina `SEARXNG_URL=http://localhost:8080`. O sistema usa automaticamente as famílias curadas quando a variável está ausente. |
| `TimeoutError (5000ms)` | Contêiner sobrecarregado ou mecanismos upstream lentos | O SearXNG encerra a tentativa automaticamente, sem travar a geração do site. |

---

## 8. Comportamento em produção e ambientes serverless (Vercel)

- Em `NODE_ENV === 'production'`, `SEARXNG_URL` **deve** ser informado explicitamente quando houver uma instância auto-hospedada disponível.
- Se `SEARXNG_URL` estiver ausente em produção, o SearXNG é marcado imediatamente como `isConfigured() === false`.
- O servidor **nunca** tenta acessar `localhost:8080` em ambientes de produção ou serverless, evitando timeouts, erros de conexão recusada e latência da função.
- A cadeia de provedores segue diretamente para o Brave Search, quando `BRAVE_SEARCH_API_KEY` estiver configurada, ou ativa de forma resiliente as famílias piloto curadas (`pilotFamilies`) sem atrasos.
