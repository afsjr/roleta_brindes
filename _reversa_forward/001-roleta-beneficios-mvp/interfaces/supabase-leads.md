# Interface: Supabase REST API — Leads

> Identificador: `001-roleta-beneficios-mvp`
> Contrato: HTTP POST / GET para `public.leads`

## 1. Endpoints

### 1.1 Inserção de Lead (Operador em Campo)
- **Método:** `POST`
- **URL:** `{SUPABASE_URL}/rest/v1/leads`
- **Headers:**
  - `apikey`: `{SUPABASE_ANON_KEY}`
  - `Authorization`: `Bearer {SUPABASE_ANON_KEY}`
  - `Content-Type`: `application/json`
  - `Prefer`: `return=minimal`
- **Payload Request:**
  ```json
  {
    "id": "e89c094e-...",
    "nome": "Maria Pereira",
    "telefone": "(11) 97777-6666",
    "cpf": "123.456.789-10",
    "consentimento": true,
    "operador_id": "OP-01",
    "beneficio_sorteado": "Desconto 30%",
    "timestamp_local": "2026-11-03T14:30:00.000Z"
  }
  ```
- **Response Esperado:** `201 Created`
- **Erros Mapeados:**
  - `409 Conflict`: Lead com mesmo UUID já gravado -> Tratar como sucesso local (`sincronizado: true`).
  - `400 Bad Request`: Validação falhou -> Armazenar em fila de exceções.
  - `5xx / Network Error`: Falha temporária -> Manter `sincronizado: false` para retry.

### 1.2 Leitura / Exportação de Leads (Painel Admin)
- **Método:** `GET`
- **URL:** `{SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`
- **Headers:**
  - `apikey`: `{SUPABASE_SERVICE_KEY}` ou chave autenticada de admin
  - `Authorization`: `Bearer {SUPABASE_SERVICE_KEY}`
  - `Range`: `0-49` (paginação de 50 registros)
- **Response:** `200 OK` com array JSON de leads.
