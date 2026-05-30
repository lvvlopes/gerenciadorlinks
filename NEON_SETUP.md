# 🐘 Configurando o banco de dados com Neon (grátis)

## Passo 1 — Criar conta no Neon

1. Acesse [neon.tech](https://neon.tech) e clique em **Sign Up** (é grátis)
2. Pode entrar com conta do GitHub ou Google

---

## Passo 2 — Criar o projeto

1. No dashboard, clique em **"New Project"**
2. Preencha:
   - **Name:** `linkvault` (qualquer nome)
   - **Postgres version:** 16
   - **Region:** escolha o mais próximo do Brasil (ex: `US East - N. Virginia`)
3. Clique em **"Create Project"**

---

## Passo 3 — Pegar a connection string

1. Na página do projeto, vá em **"Connection Details"**
2. Em **"Connection string"**, selecione o formato **`postgresql`**
3. Copie a string — ela vai parecer com isso:

```
postgresql://usuario:senha@ep-xxx-yyy.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## Passo 4 — Configurar o projeto

Abra o arquivo `backend/.env` e cole a connection string:

```env
DATABASE_URL=postgresql://usuario:senha@ep-xxx-yyy.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> ✅ Pode colar exatamente como veio do Neon — o projeto detecta automaticamente
> e adiciona o driver `asyncpg` e SSL quando necessário.

---

## Passo 5 — Rodar o backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Na primeira execução, o backend **cria todas as tabelas automaticamente** no Neon. Não precisa rodar nenhuma migration manualmente.

---

## Verificando se funcionou

Acesse [http://localhost:8000/health](http://localhost:8000/health) — deve retornar:
```json
{"status": "ok"}
```

E no painel do Neon, em **"Tables"**, você verá as tabelas `links`, `groups` e `pdfs` criadas.

---

## Limites do plano gratuito do Neon

| Recurso | Limite grátis |
|---------|---------------|
| Armazenamento | 512 MB |
| Projetos | 1 |
| Branches | 10 |
| Compute (horas/mês) | 191,9 horas |

Para o LinkVault pessoal, o plano grátis é mais do que suficiente.
