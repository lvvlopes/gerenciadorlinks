import httpx
import trafilatura
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Optional
import re


SOCIAL_PATTERNS = {
    "instagram": r"instagram\.com/(p|reel|tv)/([A-Za-z0-9_-]+)",
    "tiktok": r"tiktok\.com/@[\w.]+/video/(\d+)",
    "youtube": r"(youtube\.com/watch\?v=|youtu\.be/)([\w-]+)",
    "twitter": r"(twitter\.com|x\.com)/\w+/status/(\d+)",
    "linkedin": r"linkedin\.com/(posts|pulse)/",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "DNT": "1",
}


def detect_platform(url: str) -> Optional[str]:
    for platform, pattern in SOCIAL_PATTERNS.items():
        if re.search(pattern, url, re.IGNORECASE):
            return platform
    return None


async def scrape_url(url: str) -> dict:
    platform = detect_platform(url)

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=25.0,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            html = response.text
    except httpx.TimeoutException:
        raise ValueError("Tempo limite excedido ao acessar a URL")
    except httpx.HTTPStatusError as e:
        if e.response.status_code in (403, 401) and platform:
            return _social_fallback(url, platform)
        raise ValueError(f"Erro HTTP {e.response.status_code} ao acessar a URL")
    except Exception as e:
        raise ValueError(f"Não foi possível acessar a URL: {str(e)}")

    soup = BeautifulSoup(html, "lxml")
    title = _extract_title(soup, url)
    content = _extract_content(html, soup, platform)
    favicon = _extract_favicon(soup, url)
    thumbnail = _extract_thumbnail(soup)

    return {
        "title": title,
        "content": content,
        "favicon": favicon,
        "thumbnail": thumbnail,
        "platform": platform,
    }


def _extract_content(html: str, soup: BeautifulSoup, platform: Optional[str]) -> str:
    if platform in ("instagram", "tiktok", "twitter"):
        for prop, attr in [("property", "og:description"), ("name", "twitter:description")]:
            tag = soup.find("meta", {prop: attr})
            if tag and tag.get("content"):
                return tag["content"].strip()

    content = trafilatura.extract(html, include_comments=False, include_tables=True, no_fallback=False)
    if content and len(content) > 100:
        return content

    for prop, attr in [("property", "og:description"), ("name", "description")]:
        tag = soup.find("meta", {prop: attr})
        if tag and tag.get("content"):
            return tag["content"].strip()

    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return " ".join(soup.get_text(separator=" ").split())[:5000]


def _extract_title(soup: BeautifulSoup, url: str) -> str:
    for prop in ["og:title", "twitter:title"]:
        tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        if tag and tag.get("content"):
            return tag["content"].strip()

    if soup.title and soup.title.string:
        title = soup.title.string.strip()
        for sep in [" | ", " - ", " – ", " · "]:
            if sep in title:
                title = title.split(sep)[0].strip()
                break
        return title

    return urlparse(url).netloc or url


def _extract_favicon(soup: BeautifulSoup, url: str) -> Optional[str]:
    parsed = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    for rel in ["shortcut icon", "icon", "apple-touch-icon"]:
        link = soup.find("link", rel=lambda r: r and rel in r)
        if link and link.get("href"):
            href = link["href"]
            if href.startswith("http"):
                return href
            if href.startswith("//"):
                return f"{parsed.scheme}:{href}"
            return urljoin(base_url, href)

    return f"https://www.google.com/s2/favicons?domain={parsed.netloc}&sz=32"


def _extract_thumbnail(soup: BeautifulSoup) -> Optional[str]:
    for prop in ["og:image", "og:image:url"]:
        tag = soup.find("meta", property=prop)
        if tag and tag.get("content") and tag["content"].startswith("http"):
            return tag["content"]

    tag = soup.find("meta", attrs={"name": "twitter:image"})
    if tag and tag.get("content"):
        return tag["content"]

    return None


def _social_fallback(url: str, platform: str) -> dict:
    names = {"instagram": "Instagram", "tiktok": "TikTok", "youtube": "YouTube",
             "twitter": "X (Twitter)", "linkedin": "LinkedIn"}
    name = names.get(platform, platform.title())
    return {
        "title": f"Post no {name}",
        "content": f"Conteúdo do {name}. O resumo será gerado com base na URL.",
        "favicon": f"https://www.google.com/s2/favicons?domain={platform}.com&sz=32",
        "thumbnail": None,
        "platform": platform,
    }


def is_valid_url(url: str) -> bool:
    try:
        result = urlparse(url)
        return all([result.scheme in ("http", "https"), result.netloc])
    except Exception:
        return False
