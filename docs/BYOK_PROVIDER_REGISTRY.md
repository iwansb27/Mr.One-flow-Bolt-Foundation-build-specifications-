# MR.ONE — Provider Registry Contract

The provider registry decouples MR.ONE business workflows from external vendors.

## Logical capabilities

| Capability | Adapter contract | Initial reference provider |
|---|---|---|
| `metadata_generation` | `generateMetadata(videoContext, contentType, constraints)` | OpenRouter |
| `external_research` | `search(query, constraints)` | Tavily |
| `asset_storage` | `put/get/delete(asset)` | Deployment-selected storage |
| `publishing` | `schedule/publish/status/cancel(post)` | Buffer |

## Adapter requirements

Every adapter must:

1. Receive configuration from the secure runtime configuration layer.
2. Never read credentials from content/database records.
3. Expose health/test behavior without leaking secrets.
4. Normalize provider errors into MR.ONE error classes.
5. Be replaceable without changing the orchestration workflow.
6. Keep provider-specific request/response mapping inside the adapter.

## AI provider contract

The workflow should consume a normalized result similar to:

```json
{
  "title": "...",
  "category": "...",
  "description": "...",
  "metadata": {},
  "confidence": 0,
  "evidence": []
}
```

The provider adapter owns model-specific request/response mapping. The workflow owns business rules, content type, validation, persistence, review, scheduling, and status transitions.

## Affiliate rule

The user supplies exactly one affiliate URL. Marketplace recognition is derived from the URL/domain and product context. The user must not be forced to manually select a marketplace when the domain can be identified.

Provider credentials are never additional affiliate form fields.

## Content safety / factuality

For `VIRAL NEWS INDONESIA`, metadata generation must distinguish facts present in the supplied video/context from uncertain or missing information. The provider must not be instructed to invent names, dates, claims, or sources.

If external research is enabled, research evidence should remain distinguishable from video-derived context.

## Configuration example

```json
{
  "capabilities": {
    "metadata_generation": {
      "provider": "openrouter",
      "model": "operator-selected"
    },
    "external_research": {
      "provider": "tavily",
      "enabled": false
    },
    "publishing": {
      "provider": "buffer"
    }
  }
}
```

The JSON above is configuration metadata only; secrets are resolved from the runtime secret store/environment by secret reference.
