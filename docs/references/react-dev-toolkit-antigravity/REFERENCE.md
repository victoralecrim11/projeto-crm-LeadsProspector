# REFERENCE SNAPSHOT

Esta pasta NÃO é uma instalação executável do plugin. O plugin operacional vive no Antigravity e não no CRM.

## Motivo
Este snapshot mantém a *guidance* estática (`react-dev` e `ui-ux`) que o ProspectorCRM necessita para gerar código previsível. Isso garante a reprodutibilidade dos relatórios e do código gerado, mesmo que a versão global do plugin mude.

## Origem
- **Versão Real Sincronizada:** 1.3.3
- **Commit Real:** 3dabf36a9826a80d4b6f2404ed58295cb9557f6a

## Estratégia de Atualização
Se for necessário atualizar as referências, copie apenas as pastas estritas usadas, e atualize o `reference-manifest.json`. Não copie a pasta inteira, e não adicione agents ao projeto.
