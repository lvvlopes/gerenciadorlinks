// content.js - Roda dentro da página, com acesso ao DOM completo

const EXTRACTORS = {
  // ─── INSTAGRAM ───────────────────────────────────────────────
  instagram: () => {
    const url = location.href;

    // Post / Reel aberto em modal ou página própria
    const articleEl = document.querySelector("article");
    if (!articleEl) return null;

    // Caption/legenda — múltiplos seletores para cobrir variações de layout
    const captionSelectors = [
      'article h1',
      'article [data-testid="post-comment-root"] span',
      'article ul li:first-child span[dir="auto"]',
      'article div > span[dir="auto"]',
      'div[role="dialog"] h1',
      'div[role="dialog"] span[dir="auto"]',
    ];

    let caption = "";
    for (const sel of captionSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 10) {
        caption = el.textContent.trim();
        break;
      }
    }

    // Alt text das imagens (Instagram gera automaticamente)
    const imgAlts = [...document.querySelectorAll("article img[alt]")]
      .map(img => img.alt)
      .filter(alt => alt && alt.length > 5 && !alt.includes("foto de perfil"))
      .join(". ");

    // Autor
    const authorEl = document.querySelector(
      'article header a, div[role="dialog"] header a'
    );
    const author = authorEl ? authorEl.textContent.trim() : "";

    // Tipo de conteúdo
    const isReel = url.includes("/reel/");
    const isVideo = !!document.querySelector("article video");
    const type = isReel ? "Reel" : isVideo ? "Vídeo" : "Post";

    const parts = [];
    if (author) parts.push(`${type} de @${author}`);
    if (caption) parts.push(caption);
    if (imgAlts && !caption) parts.push(`Imagem: ${imgAlts}`);

    return {
      title: author ? `${type} de @${author} no Instagram` : "Post no Instagram",
      content: parts.join("\n\n") || imgAlts || "Post do Instagram",
      thumbnail: document.querySelector("article img")?.src || null,
    };
  },

  // ─── TIKTOK ──────────────────────────────────────────────────
  tiktok: () => {
    const selectors = [
      '[data-e2e="browse-video-desc"]',
      '[data-e2e="video-desc"]',
      'h1[data-e2e="video-title"]',
      '.tiktok-1ejylhp-DivContainer span',
      'div[class*="DivVideoInfoContainer"] span',
    ];

    let caption = "";
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 5) {
        caption = el.textContent.trim();
        break;
      }
    }

    const authorEl = document.querySelector(
      '[data-e2e="browse-username"], [data-e2e="video-author-uniqueid"]'
    );
    const author = authorEl ? authorEl.textContent.trim() : "";

    // Hashtags
    const hashtags = [...document.querySelectorAll('a[href*="/tag/"]')]
      .map(a => a.textContent.trim())
      .filter(t => t.startsWith("#"))
      .slice(0, 8)
      .join(" ");

    const content = [
      author ? `Vídeo de @${author} no TikTok` : "",
      caption,
      hashtags,
    ].filter(Boolean).join("\n\n");

    return {
      title: author ? `@${author} no TikTok` : "Vídeo no TikTok",
      content: content || "Vídeo do TikTok",
      thumbnail: document.querySelector("video")?.poster || null,
    };
  },

  // ─── TWITTER / X ─────────────────────────────────────────────
  twitter: () => {
    const tweetSelectors = [
      'article[data-testid="tweet"] div[data-testid="tweetText"]',
      'article div[lang]',
      '[data-testid="tweetText"]',
    ];

    let tweetText = "";
    for (const sel of tweetSelectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        // Pega o primeiro tweet (o principal, não os replies)
        tweetText = els[0].textContent.trim();
        break;
      }
    }

    const authorEl = document.querySelector(
      'article[data-testid="tweet"] div[data-testid="User-Name"]'
    );
    const author = authorEl ? authorEl.textContent.trim().split("\n")[0] : "";

    // Imagem do tweet
    const img = document.querySelector(
      'article[data-testid="tweet"] img[src*="pbs.twimg.com/media"]'
    );

    return {
      title: author ? `Tweet de ${author}` : "Tweet",
      content: tweetText || "Tweet do X/Twitter",
      thumbnail: img?.src || null,
    };
  },

  // ─── YOUTUBE ─────────────────────────────────────────────────
  youtube: () => {
    const title =
      document.querySelector("h1.ytd-watch-metadata yt-formatted-string")?.textContent?.trim() ||
      document.querySelector("h1.title")?.textContent?.trim() ||
      document.title;

    const description =
      document.querySelector("ytd-text-inline-expander #description-inline-expander")?.textContent?.trim() ||
      document.querySelector("#description yt-attributed-string")?.textContent?.trim() ||
      document.querySelector("ytd-expander #content")?.textContent?.trim() ||
      "";

    const channel =
      document.querySelector("ytd-channel-name #channel-name a")?.textContent?.trim() ||
      document.querySelector("#owner #channel-name a")?.textContent?.trim() ||
      "";

    const thumbnail =
      document.querySelector("video")?.poster ||
      `https://img.youtube.com/vi/${new URLSearchParams(location.search).get("v")}/maxresdefault.jpg`;

    return {
      title: title || "Vídeo do YouTube",
      content: [
        channel ? `Canal: ${channel}` : "",
        description.slice(0, 1500),
      ].filter(Boolean).join("\n\n"),
      thumbnail,
    };
  },

  // ─── LINKEDIN ────────────────────────────────────────────────
  linkedin: () => {
    const postSelectors = [
      ".feed-shared-update-v2__description",
      ".attributed-text-segment-list__content",
      "article .feed-shared-text",
      ".update-components-text",
    ];

    let postText = "";
    for (const sel of postSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 10) {
        postText = el.textContent.trim();
        break;
      }
    }

    const authorEl = document.querySelector(
      ".feed-shared-actor__name, .update-components-actor__name"
    );
    const author = authorEl ? authorEl.textContent.trim() : "";

    return {
      title: author ? `Post de ${author} no LinkedIn` : "Post no LinkedIn",
      content: postText || "Post do LinkedIn",
      thumbnail: null,
    };
  },

  // ─── REDDIT ──────────────────────────────────────────────────
  reddit: () => {
    const title =
      document.querySelector("h1[slot='title'], shreddit-post h1")?.textContent?.trim() ||
      document.querySelector('h1[data-testid="post-title"]')?.textContent?.trim() ||
      "";

    const body =
      document.querySelector('[data-testid="post-content"] p')?.textContent?.trim() ||
      document.querySelector(".RichTextJSON-root p")?.textContent?.trim() ||
      "";

    const subreddit =
      document.querySelector('[data-testid="subreddit-name"]')?.textContent?.trim() ||
      location.pathname.split("/")[2] || "";

    return {
      title: title || "Post no Reddit",
      content: [
        subreddit ? `Subreddit: r/${subreddit.replace("r/", "")}` : "",
        body || title,
      ].filter(Boolean).join("\n\n"),
      thumbnail: null,
    };
  },

  // ─── GENÉRICO (qualquer site) ─────────────────────────────────
  generic: () => {
    const title =
      document.querySelector('meta[property="og:title"]')?.content ||
      document.querySelector('meta[name="twitter:title"]')?.content ||
      document.title;

    const description =
      document.querySelector('meta[property="og:description"]')?.content ||
      document.querySelector('meta[name="description"]')?.content ||
      "";

    // Tenta pegar o artigo principal
    const articleEl =
      document.querySelector("article") ||
      document.querySelector('[role="main"]') ||
      document.querySelector("main");

    let bodyText = "";
    if (articleEl) {
      // Remove scripts/styles
      const clone = articleEl.cloneNode(true);
      clone.querySelectorAll("script, style, nav, footer, aside").forEach(el => el.remove());
      bodyText = clone.textContent.replace(/\s+/g, " ").trim().slice(0, 2000);
    }

    const thumbnail =
      document.querySelector('meta[property="og:image"]')?.content ||
      document.querySelector('meta[name="twitter:image"]')?.content ||
      null;

    return {
      title: title || location.href,
      content: bodyText || description || title,
      thumbnail,
    };
  },
};

// Detecta qual extrator usar
function detectExtractor() {
  const host = location.hostname;
  if (host.includes("instagram.com")) return EXTRACTORS.instagram;
  if (host.includes("tiktok.com")) return EXTRACTORS.tiktok;
  if (host.includes("twitter.com") || host.includes("x.com")) return EXTRACTORS.twitter;
  if (host.includes("youtube.com") || host.includes("youtu.be")) return EXTRACTORS.youtube;
  if (host.includes("linkedin.com")) return EXTRACTORS.linkedin;
  if (host.includes("reddit.com")) return EXTRACTORS.reddit;
  return EXTRACTORS.generic;
}

// Escuta mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractContent") {
    try {
      const extractor = detectExtractor();
      const data = extractor();
      sendResponse({ success: true, data, url: location.href });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true; // mantém o canal aberto para resposta assíncrona
});
