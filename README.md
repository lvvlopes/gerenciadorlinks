# 🔗 LinkVault

> Sua biblioteca de links com resumos automáticos via IA

![LinkVault](https://img.shields.io/badge/Python-3.12-blue) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)

## ✨ Funcionalidades

- 🔗 **Captura de links** — Cole uma URL e o sistema extrai título, thumbnail e conteúdo automaticamente
- 🤖 **Resumo com IA** — Suporte a **Anthropic Claude**, **OpenAI GPT** e **Llama via Ollama**
- 📂 **Grupos** — Organize seus links por categorias com cores personalizáveis
- ⭐ **Favoritos** — Marque e filtre links favoritos
- 📄 **PDFs** — Anexe PDFs a qualquer link, visualize dentro do app e faça download
- 🔍 **Busca** — Pesquise por título, resumo ou URL
- 🏷️ **Tags** — Tags automáticas geradas pela IA
- 📊 **Estatísticas** — Dashboard com contadores em tempo real

---

## 🚀 Rodando Localmente

### Pré-requisitos

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- (Opcional) Docker & Docker Compose

### Opção 1: Docker Compose (mais fácil)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/linkvault
cd linkvault

# Copie e configure o .env do backend
cp backend/.env.example backend/.env
# Edite backend/.env com suas chaves de API

# Suba tudo com Docker
docker compose up -d

# Acesse:
# Frontend: http://localhost:3000
# API docs: http://localhost:8000/docs
```

### Opção 2: Manual

#### Backend (FastAPI)

```bash
cd backend

# Crie o ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

# Instale dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# Crie o banco de dados PostgreSQL
createdb linkvault

# Rode o servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend (Next.js)

```bash
cd frontend

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000

# Rode o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

---

## ⚙️ Configuração das LLMs

No arquivo `backend/.env`:

### Anthropic Claude (recomendado)
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
DEFAULT_LLM_PROVIDER=anthropic
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

### OpenAI GPT
```env
OPENAI_API_KEY=sk-...
DEFAULT_LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
```

### Llama via Ollama (local, gratuito)
```bash
# Instale o Ollama: https://ollama.ai
ollama pull llama3.2
```
```env
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

---

## ☁️ Deploy na Vercel + Railway/Render

### Backend (Railway ou Render)

1. Crie uma conta em [railway.app](https://railway.app) ou [render.com](https://render.com)
2. Crie um serviço PostgreSQL
3. Faça deploy da pasta `backend/` como serviço Python/FastAPI
4. Configure as variáveis de ambiente (`.env.example`)
5. Anote a URL do backend (ex: `https://linkvault-api.railway.app`)

### Frontend (Vercel)

```bash
cd frontend

# Instale a Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure a variável de ambiente na Vercel:
# NEXT_PUBLIC_API_URL = https://sua-api.railway.app
```

Ou conecte o repositório diretamente no [vercel.com](https://vercel.com) e configure:
- **Root Directory:** `frontend`
- **Environment Variables:** `NEXT_PUBLIC_API_URL=https://sua-api.railway.app`

---

## 📁 Estrutura do Projeto

```
linkvault/
├── backend/
│   ├── app/
│   │   ├── api/          # Rotas FastAPI
│   │   │   ├── links.py
│   │   │   ├── groups.py
│   │   │   ├── pdfs.py
│   │   │   ├── llm.py
│   │   │   └── stats.py
│   │   ├── models/       # Modelos SQLAlchemy
│   │   │   ├── link.py
│   │   │   ├── group.py
│   │   │   └── pdf.py
│   │   ├── services/     # Lógica de negócio
│   │   │   ├── llm_service.py    # Integração com LLMs
│   │   │   └── scraper_service.py # Web scraping
│   │   └── core/
│   │       ├── config.py  # Configurações
│   │       └── database.py # Conexão com BD
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   │   ├── page.tsx  # Página principal
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LinkGrid.tsx
│   │   │   ├── LinkCard.tsx
│   │   │   ├── AddLinkModal.tsx
│   │   │   ├── LinkDetailModal.tsx  # Visualizador de PDF
│   │   │   ├── AddGroupModal.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── StatsBar.tsx
│   │   └── lib/
│   │       └── api.ts    # Cliente da API + tipos
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/links/` | Criar link + gerar resumo |
| `GET` | `/api/links/` | Listar links (com filtros) |
| `GET` | `/api/links/{id}` | Detalhes do link + PDFs |
| `PATCH` | `/api/links/{id}` | Editar link |
| `DELETE` | `/api/links/{id}` | Remover link |
| `POST` | `/api/links/{id}/regenerate-summary` | Regenerar resumo |
| `GET` | `/api/groups/` | Listar grupos |
| `POST` | `/api/groups/` | Criar grupo |
| `PATCH` | `/api/groups/{id}` | Editar grupo |
| `DELETE` | `/api/groups/{id}` | Remover grupo |
| `POST` | `/api/pdfs/upload/{link_id}` | Enviar PDF |
| `GET` | `/api/pdfs/view/{id}` | Visualizar PDF |
| `GET` | `/api/pdfs/download/{id}` | Download PDF |
| `DELETE` | `/api/pdfs/{id}` | Remover PDF |
| `GET` | `/api/stats/` | Estatísticas gerais |
| `GET` | `/api/llm/providers` | Provedores disponíveis |

Documentação interativa: **http://localhost:8000/docs**
