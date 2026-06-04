from typing import Optional
import os
import json


SUMMARY_PROMPT = """Você é um assistente que cria resumos concisos de conteúdo salvo pelo usuário.

Dado o título e o conteúdo (que pode ser texto de um artigo, ou uma descrição manual feita pelo usuário para posts de redes sociais), crie:
1. Um resumo de 2-4 frases diretas e específicas explicando do que se trata o conteúdo
2. 3-5 tags/palavras-chave relevantes

Seja específico. Evite frases genéricas como "este conteúdo aborda" ou "este post trata de".
Escreva o resumo como se estivesse explicando o conteúdo para um amigo.

Responda SOMENTE neste formato JSON (sem markdown, sem texto extra):
{{"summary": "resumo aqui", "tags": ["tag1", "tag2", "tag3"]}}

Título: {title}
Conteúdo: {content}"""


def _get(key: str, default: str = "") -> str:
    """Lê variável de ambiente diretamente do os.environ — ignora .env file."""
    return os.environ.get(key) or default


async def generate_summary(
    title: str,
    content: str,
    provider: Optional[str] = None,
) -> dict:
    provider = provider or _get("DEFAULT_LLM_PROVIDER", "openai")
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

    api_key = _get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY não configurada")

    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model=_get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    text = message.content[0].text.strip()
    return json.loads(text)


async def _openai_summary(prompt: str) -> dict:
    from openai import AsyncOpenAI

    api_key = _get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY não configurada")

    client = AsyncOpenAI(api_key=api_key)
    response = await client.chat.completions.create(
        model=_get("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[{"role": "user", "content": prompt}],
        max_tokens=512,
        response_format={"type": "json_object"},
    )
    text = response.choices[0].message.content.strip()
    return json.loads(text)


async def _ollama_summary(prompt: str) -> dict:
    import httpx

    base_url = _get("OLLAMA_BASE_URL", "http://localhost:11434")
    async with httpx.AsyncClient(base_url=base_url) as client:
        response = await client.post(
            "/api/generate",
            json={
                "model": _get("OLLAMA_MODEL", "llama3.2"),
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
            timeout=60.0,
        )
        data = response.json()
        return json.loads(data["response"])


async def get_available_providers() -> list[dict]:
    providers = []

    if _get("ANTHROPIC_API_KEY"):
        providers.append({
            "id": "anthropic",
            "name": "Anthropic Claude",
            "model": _get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
            "available": True,
        })

    if _get("OPENAI_API_KEY"):
        providers.append({
            "id": "openai",
            "name": "OpenAI GPT",
            "model": _get("OPENAI_MODEL", "gpt-4o-mini"),
            "available": True,
        })

    try:
        import httpx
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{_get('OLLAMA_BASE_URL', 'http://localhost:11434')}/api/tags",
                timeout=3.0,
            )
            if r.status_code == 200:
                providers.append({
                    "id": "ollama",
                    "name": "Ollama (Local)",
                    "model": _get("OLLAMA_MODEL", "llama3.2"),
                    "available": True,
                })
    except Exception:
        providers.append({
            "id": "ollama",
            "name": "Ollama (Local)",
            "model": _get("OLLAMA_MODEL", "llama3.2"),
            "available": False,
        })

    return providers
