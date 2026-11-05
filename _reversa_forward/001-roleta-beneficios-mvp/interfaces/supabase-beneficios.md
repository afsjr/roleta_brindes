# Interface: Supabase REST API — Benefícios

> Identificador: `001-roleta-beneficios-mvp`
> Contrato: HTTP GET / POST / PATCH para `public.beneficios`

## 1. Endpoints

### 1.1 Listagem de Benefícios Ativos (PWA / Operador)
- **Método:** `GET`
- **URL:** `{SUPABASE_URL}/rest/v1/beneficios?ativo=eq.true&deletado_em=is.null&select=id,nome,peso`
- **Headers:**
  - `apikey`: `{SUPABASE_ANON_KEY}`
  - `Authorization`: `Bearer {SUPABASE_ANON_KEY}`
- **Response Esperado:** `200 OK`
  ```json
  [
    {"id": "b1...", "nome": "Bolsa 50%", "peso": 1},
    {"id": "b2...", "nome": "Kit Escolar", "peso": 2}
  ]
  ```

### 1.2 Cadastro de Novo Benefício (Painel Admin)
- **Método:** `POST`
- **URL:** `{SUPABASE_URL}/rest/v1/beneficios`
- **Headers:**
  - `apikey`: `{SUPABASE_SERVICE_KEY}` (ou chave admin)
  - `Authorization`: `Bearer {SUPABASE_SERVICE_KEY}`
  - `Content-Type`: `application/json`
- **Payload Request:**
  ```json
  {
    "nome": "Curso Gratuito de Redação",
    "peso": 1,
    "ativo": true
  }
  ```
- **Response Esperado:** `201 Created`

### 1.3 Atualização / Desativação de Benefício
- **Método:** `PATCH`
- **URL:** `{SUPABASE_URL}/rest/v1/beneficios?id=eq.{ID}`
- **Payload Request:**
  ```json
  {
    "ativo": false
  }
  ```
- **Response Esperado:** `204 No Content`
