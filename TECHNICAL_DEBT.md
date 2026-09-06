# Dívida técnica de tipagem

`strict` ainda não está habilitado globalmente no TypeScript para evitar ampliar esta correção em erros fora do escopo. Os campos opcionais introduzidos ou ajustados nesta refatoração (`rating`, `reviewsCount`, `audit`, coordenadas e dados OSM) são verificados explicitamente antes do uso.

Próximo passo recomendado: ativar `strict` gradualmente por área, começando pelas telas do Prospector e pelos serviços externos.
