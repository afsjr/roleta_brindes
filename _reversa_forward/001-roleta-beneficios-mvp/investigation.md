# Investigation: Roleta de Benefícios — MVP Completo

> Identificador: `001-roleta-beneficios-mvp`
> Data: `2026-11-03`
> Requirements: `_reversa_forward/001-roleta-beneficios-mvp/requirements.md`

## 1. Pesquisa de Fundo e Alternativas Avaliadas

### 1.1 Arquitetura Offline-First no Navegador
- **IndexedDB vs. LocalStorage:**
  - LocalStorage tem limite de 5MB, é síncrono e bloqueia a thread de renderização da UI.
  - IndexedDB é assíncrono, armazena blobs e grandes volumes de objetos JSON estruturados.
  - **Decisão:** Uso do IndexedDB (via wrapper leve `localForage` ou implementação nativa pura com Promises) para garantir robustez e performance em celulares de baixo custo.

### 1.2 Mecanismo de Sincronização (Sync)
- **Background Sync API vs. Eventos Online/Offline com Loop Serial:**
  - Background Sync API não é universalmente suportada (ex.: Safari no iOS possui restrições severas).
  - `window.addEventListener('online')` + checagem no `DOMContentLoaded` (`navigator.onLine`) funciona em 100% dos navegadores modernos móveis.
  - **Decisão:** Sincronização disparada por eventos de conectividade com fila em FIFO serial. Se falhar, o item mantém `sincronizado: false` para retry na próxima conexão.

### 1.3 Canvas 2D vs. SVG/CSS para a Roleta
- **Animação em Canvas:**
  - Desempenho superior a 60fps em dispositivos móveis, sem renderização excessiva de DOM nodes.
  - Cálculo trigonométrico direto para fatias e paradas exatas.
  - A rotação determinística (calculada previamente antes da animação iniciar) garante que a animação seja puramente cosmética, impedindo manipulações ou falhas no término.

### 1.4 Integração Supabase
- Chamadas diretas via `fetch` HTTP REST (`/rest/v1/leads` e `/rest/v1/beneficios`).
- Elimina a necessidade de carregar o SDK completo do Supabase (~150KB), reduzindo drasticamente o tempo de carregamento da PWA.
- Headers padrão: `apikey: <anon_key>` e `Authorization: Bearer <anon_key>` para o operador; chave de admin opcional no painel admin para leitura irrestrita com RLS.

---
Gerado por reversa-plan em 2026-11-03
