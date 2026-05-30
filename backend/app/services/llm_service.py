from typing import Optional
from app.core.config import settings
from dotenv import load_dotenv

load_dotenv(override=True)

SUMMARY_PROMPT = """Você é um assistente que cria resumos concisos de conteúdo web.

Dado o título e conteúdo de uma página web, crie:
1. Um resumo de 2-4 frases explicando do que se trata
2. 3-5 palavras-chave relevantes separadas por vírgula

Responda SOMENTE neste formato JSON (sem markdown):
{{"summary": "resumo aqui", "tags": ["tag1", "tag2", "tag3"]}}

Título: {title}
Conteúdo: {content}"""


async def generate_summary(
    title: str,
    content: str,
    provider: Optional[str] = None,
) -> dict:
    """Generate summary using the configured LLM provider."""
    provider = provider or settings.DEFAULT_LLM_PROVIDER
    prompt = SUMMARY_PROMPT.format(title=title, content=content[:8000])

    try:
        if provider == "anthropic":
            return await _anthropic_summary(prompt)
        elif provider == "openai":
            return await _openai_summary(prompt)
        elif provider == "ollama":
            return await _ollama_summary(prompt)
        else:
            raise ValueError(f"Unknown provider: {provider}")
    except Exception as e:
        return {
            "summary": f"Não foi possível gerar o resumo automático. ({str(e)[:100]})",
            "tags": [],
        }


async def _anthropic_summary(prompt: str) -> dict:
    import anthropic
    import json

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = await client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    text = message.content[0].text.strip()
    return json.loads(text)

async def _openai_summary(prompt: str) -> dict:
    from openai import AsyncOpenAI
    import json

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=512,
        response_format={"type": "json_object"},
    )
    text = response.choices[0].message.content.strip()
    return json.loads(text)


async def _ollama_summary(prompt: str) -> dict:
    import httpx
    import json

    async with httpx.AsyncClient(base_url=settings.OLLAMA_BASE_URL) as client:
        response = await client.post(
            "/api/generate",
            json={
                "model": settings.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
            timeout=60.0,
        )
        data = response.json()
        return json.loads(data["response"])


async def get_available_providers() -> list[dict]:
    """Return which providers are available based on config."""
    providers = []

    if settings.ANTHROPIC_API_KEY:
        providers.append({
            "id": "anthropic",
            "name": "Anthropic Claude",
            "model": settings.ANTHROPIC_MODEL,
            "available": True,
        })

    if settings.OPENAI_API_KEY:
        providers.append({
            "id": "openai",
            "name": "OpenAI GPT",
            "model": settings.OPENAI_MODEL,
            "available": True,
        })

    # Check if Ollama is running
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=3.0)
            if r.status_code == 200:
                providers.append({
                    "id": "ollama",
                    "name": "Ollama (Local)",
                    "model": settings.OLLAMA_MODEL,
                    "available": True,
                })
    except Exception:
        providers.append({
            "id": "ollama",
            "name": "Ollama (Local)",
            "model": settings.OLLAMA_MODEL,
            "available": False,
        })

    return providers
