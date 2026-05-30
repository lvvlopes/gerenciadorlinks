# ⚡ LinkVault Saver — Extensão Chrome

Salve qualquer link direto no LinkVault com um clique, com leitura automática do conteúdo da página — funciona até em contas logadas no Instagram, TikTok e outras redes sociais.

## Plataformas suportadas

| Plataforma | O que extrai |
|------------|-------------|
| Instagram | Legenda do post, alt text das imagens, autor |
| TikTok | Descrição do vídeo, hashtags, autor |
| Twitter / X | Texto do tweet, autor |
| YouTube | Título, descrição, canal |
| LinkedIn | Texto do post, autor |
| Reddit | Título, corpo do post, subreddit |
| Qualquer site | OG tags, meta description, texto do artigo |

## Como instalar

### Modo desenvolvedor (sem publicar na Chrome Web Store)

1. Abra o Chrome e acesse: `chrome://extensions`
2. Ative o **"Modo do desenvolvedor"** (toggle no canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta `extension/` deste projeto
5. A extensão aparece na barra do Chrome com o ícone ⚡

## Como usar

1. Abra qualquer página ou post que queira salvar
2. Clique no ícone ⚡ na barra do Chrome
3. A extensão lê o conteúdo automaticamente
4. Escolha o grupo e a IA para resumo
5. Clique **"Salvar no LinkVault"**

## Configuração

Na primeira vez (ou se mudar a URL do backend):

1. Clique no ícone ⚡
2. Clique em **⚙ Configurar** no rodapé
3. Preencha:
   - **URL do backend:** `http://localhost:8000` (local) ou URL do Railway/Render
   - **URL do frontend:** `http://localhost:3000` (local) ou URL da Vercel
4. Clique **Salvar**

## Como funciona com Instagram

A extensão roda dentro do contexto do seu navegador, onde você já está logado. Ela lê o DOM da página — a legenda, o autor, o alt text das imagens — e manda esse conteúdo para o backend gerar um resumo real, não genérico.

Não usa API oficial, não precisa de tokens, funciona com qualquer conta logada.
