// popup.js

const DEFAULT_API_URL = "http://localhost:8000";
const DEFAULT_FRONTEND_URL = "http://localhost:3000";

// ─── State ────────────────────────────────────────────────────
let extractedData = null;
let apiUrl = DEFAULT_API_URL;
let frontendUrl = DEFAULT_FRONTEND_URL;

// ─── DOM refs ─────────────────────────────────────────────────
const states = {
  loading: document.getElementById("state-loading"),
  form: document.getElementById("state-form"),
  success: document.getElementById("state-success"),
  config: document.getElementById("state-config"),
};

function showState(name) {
  Object.values(states).forEach(el => el.classList.remove("active"));
  states[name].classList.add("active");
}

function showError(msg) {
  const banner = document.getElementById("error-banner");
  banner.textContent = msg;
  banner.classList.add("show");
  setTimeout(() => banner.classList.remove("show"), 5000);
}

// ─── Init ─────────────────────────────────────────────────────
async function init() {
  // Load saved config
  const stored = await chrome.storage.local.get(["apiUrl", "frontendUrl", "defaultProvider", "defaultGroup"]);
  apiUrl = stored.apiUrl || DEFAULT_API_URL;
  frontendUrl = stored.frontendUrl || DEFAULT_FRONTEND_URL;

  if (stored.defaultProvider) {
    document.getElementById("provider-select").value = stored.defaultProvider;
  }

  // Load groups
  await loadGroups(stored.defaultGroup);

  // Extract content from current tab
  showState("loading");
  await extractFromTab();
}

async function loadGroups(defaultGroupId) {
  try {
    const res = await fetch(`${apiUrl}/api/groups`);
    if (!res.ok) throw new Error("Falha ao carregar grupos");
    const groups = await res.json();

    const select = document.getElementById("group-select");
    groups.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.name;
      if (g.id === defaultGroupId) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (e) {
    // Silently fail - groups are optional
  }
}

async function extractFromTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Try sending message to existing content script first
    let response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: "extractContent" }, (res) => {
        if (chrome.runtime.lastError) {
          resolve(null); // content script not injected yet
        } else {
          resolve(res);
        }
      });
    });

    // If no content script, inject and retry via background
    if (!response) {
      response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "injectAndExtract" }, resolve);
      });
    }

    if (response?.success && response.data) {
      extractedData = response.data;
      renderPreview(response.data, tab.url);
      showState("form");
    } else {
      // Fallback: use basic tab info
      extractedData = {
        title: tab.title || tab.url,
        content: tab.title || "",
        thumbnail: null,
      };
      renderPreview(extractedData, tab.url);
      showState("form");
    }
  } catch (err) {
    showState("form");
    showError("Não foi possível ler o conteúdo da página.");
  }
}

function renderPreview(data, url) {
  document.getElementById("preview-title").textContent = data.title || url;
  document.getElementById("preview-url").textContent = url;

  if (data.thumbnail) {
    const img = document.getElementById("preview-thumb");
    img.src = data.thumbnail;
    img.classList.remove("hidden");
    img.onerror = () => img.classList.add("hidden");
  }

  if (data.content && data.content.length > 20) {
    const contentEl = document.getElementById("preview-content");
    contentEl.textContent = data.content.slice(0, 300);
    contentEl.style.display = "block";
  }

  // Update footer
  const host = new URL(url).hostname.replace("www.", "");
  document.getElementById("footer-status").textContent = host;
}

// ─── Save link ────────────────────────────────────────────────
document.getElementById("btn-save").addEventListener("click", async () => {
  const btn = document.getElementById("btn-save");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block"></span> Salvando...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const body = {
      url: tab.url,
      custom_title: document.getElementById("custom-title").value.trim() || undefined,
      custom_notes: document.getElementById("custom-notes").value.trim() || undefined,
      group_id: document.getElementById("group-select").value || undefined,
      llm_provider: document.getElementById("provider-select").value,
      // Conteúdo extraído pela extensão do DOM — backend usa direto, sem scraping
      social_description: extractedData?.content || undefined,
      extracted_title: extractedData?.title || undefined,
      extracted_thumbnail: extractedData?.thumbnail || undefined,
    };

    const res = await fetch(`${apiUrl}/api/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Erro ${res.status}`);
    }

    const link = await res.json();

    // Save preferences
    chrome.storage.local.set({
      defaultProvider: document.getElementById("provider-select").value,
      defaultGroup: document.getElementById("group-select").value,
    });

    // Show success
    document.getElementById("success-msg").textContent =
      `"${link.display_title || link.title}" salvo com resumo gerado pela IA.`;
    showState("success");

  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<span>⚡</span> Salvar no LinkVault';
    showError(err.message || "Erro ao salvar. Verifique se o LinkVault está rodando.");
  }
});

// ─── Open vault ───────────────────────────────────────────────
document.getElementById("btn-open-vault").addEventListener("click", () => {
  chrome.tabs.create({ url: frontendUrl });
});

// ─── Config ───────────────────────────────────────────────────
document.getElementById("btn-config").addEventListener("click", async () => {
  const stored = await chrome.storage.local.get(["apiUrl", "frontendUrl"]);
  document.getElementById("config-api-url").value = stored.apiUrl || DEFAULT_API_URL;
  document.getElementById("config-frontend-url").value = stored.frontendUrl || DEFAULT_FRONTEND_URL;
  showState("config");
});

document.getElementById("btn-save-config").addEventListener("click", async () => {
  const newApiUrl = document.getElementById("config-api-url").value.trim().replace(/\/$/, "");
  const newFrontendUrl = document.getElementById("config-frontend-url").value.trim().replace(/\/$/, "");

  if (!newApiUrl) return;

  // Test connection
  try {
    const res = await fetch(`${newApiUrl}/health`);
    if (!res.ok) throw new Error();
  } catch {
    showError("Não foi possível conectar ao backend. Verifique a URL.");
    return;
  }

  await chrome.storage.local.set({ apiUrl: newApiUrl, frontendUrl: newFrontendUrl });
  apiUrl = newApiUrl;
  frontendUrl = newFrontendUrl;

  showState("form");
  document.getElementById("footer-status").textContent = "Config salva ✓";
});

document.getElementById("btn-cancel-config").addEventListener("click", () => {
  showState("form");
});

// ─── Start ────────────────────────────────────────────────────
init();
