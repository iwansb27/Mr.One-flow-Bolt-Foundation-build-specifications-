# MR.ONE — BYOK Credential Architecture

## Goal

All external provider credentials used by MR.ONE must be Bring Your Own Key (BYOK): the operator supplies, replaces, enables, disables, or tests credentials without changing the publishing workflow or application source code.

MR.ONE remains a publishing/orchestration engine. Credentials are configuration, not business logic.

## Non-negotiable rules

1. **No secrets in Git.** Never commit real API keys, OAuth client secrets, access tokens, refresh tokens, cookies, or webhook signing secrets.
2. **Environment/secret-store first.** Runtime secrets must come from the deployment platform's secret manager or environment variables.
3. **Provider abstraction.** Workflow code calls a provider interface, never a hard-coded vendor key.
4. **Replaceable providers.** Changing a provider or rotating a key must not require rewriting the workflow.
5. **No manual metadata duplication.** Provider credentials must not become additional content-entry fields.
6. **Least privilege.** Each integration gets only the permissions required for its function.
7. **Safe diagnostics.** Credential tests may report connectivity, authentication, quota/configuration errors, and provider identity, but must never display the secret value.
8. **Rotation without code changes.** Key rotation must be possible by replacing configuration and restarting/reloading the runtime as required by the host.

## Credential classes

| Capability | Configuration | Required? | Notes |
|---|---|---:|---|
| LLM / metadata generation | `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | Yes for AI metadata | Provider-neutral interface. Supports OpenAI-compatible gateways such as OpenRouter plus direct providers when implemented. |
| Web/research | `SEARCH_PROVIDER`, `SEARCH_API_KEY`, `SEARCH_BASE_URL` | Optional | Used only when a workflow requires external research. |
| Video/file storage | `STORAGE_PROVIDER`, provider-specific credentials | Yes | Must be abstracted behind storage interface. |
| Database | `DATABASE_URL` or managed DB secret | Yes | Never expose connection strings in client UI. |
| Publishing / scheduling | `PUBLISH_PROVIDER`, provider-specific credentials | Optional until publishing is enabled | Buffer is the reference publishing path from the handover. |
| Marketplace context | Marketplace/API credentials | Optional | Affiliate link recognition must work without asking the user to manually select a marketplace. Only add API credentials if a marketplace API is actually used. |
| Optional media/AI providers | Provider-specific variables | Optional | Add through the provider registry; do not hard-code credentials in workflow modules. |

## Recommended runtime model

```text
UI / Admin Settings
        |
        v
Credential Configuration Layer
        |
        +--> Secret Store / Environment
        |
        v
Provider Registry
        |
        +--> AI Provider
        +--> Search Provider
        +--> Storage Provider
        +--> Publishing Provider
        +--> Other optional integrations
        |
        v
MR.ONE Workflow
Upload -> Validate -> Metadata -> Store -> Review -> Schedule -> Buffer/Social -> Status -> Cleanup
```

## User-facing credential management

If the host application provides a Settings/Admin screen, expose credentials as masked configuration controls rather than raw secrets in ordinary content forms.

Minimum controls per provider:

- Enabled / Disabled
- Provider name
- API key/token: masked input
- Base URL: optional and validated
- Model/resource identifier: optional where applicable
- Test Connection
- Last Test Status
- Last Updated timestamp
- Remove / Rotate credential

Never echo the complete secret after save. A masked representation such as `••••••••abcd` is acceptable if the platform supports it.

## Multiple providers and key switching

The implementation should use a stable logical capability name rather than a vendor name. Example:

```text
capability: metadata_generation
active_provider: openrouter
active_model: <operator-selected-model>
secret_ref: AI_API_KEY
```

The workflow asks for `metadata_generation`, not `OPENROUTER_API_KEY`.

This permits a future switch such as:

```text
openrouter -> openai -> anthropic -> another compatible provider
```

without changing the workflow contract.

## Configuration precedence

Use this precedence unless the deployment platform requires another secure mechanism:

1. Managed secret store
2. Runtime environment variables
3. Non-secret application configuration
4. Safe defaults

Never use a checked-in `.env` containing real values.

## Secret lifecycle

**Create:** operator enters a key through the secure deployment/admin mechanism.

**Validate:** provider adapter performs a minimal authenticated request.

**Use:** workflow receives a provider client/config object, not a raw key in content records.

**Rotate:** operator replaces the secret; existing workflow code remains unchanged.

**Revoke:** operator removes/revokes the provider credential externally, then disables/removes the corresponding runtime secret.

**Audit:** application logs record provider/capability and outcome, never secret material.

## Error handling

Classify provider errors into:

- `AUTHENTICATION_FAILED`
- `AUTHORIZATION_FAILED`
- `RATE_LIMITED`
- `QUOTA_EXCEEDED`
- `INVALID_CONFIGURATION`
- `PROVIDER_UNAVAILABLE`
- `NETWORK_ERROR`
- `UNKNOWN_PROVIDER_ERROR`

User-facing errors should explain the corrective action without revealing request headers, tokens, or secret values.

## Security boundary

Credentials belong to the server/deployment boundary. Browser/client code must not receive provider secrets unless the provider explicitly requires a public client-side credential and the security model has been reviewed.

Content records, metadata records, previews, scheduling records, and status logs must not contain API keys or access tokens.

## Implementation acceptance criteria

The BYOK layer is considered complete when:

- [ ] No real secrets exist in repository history or source files.
- [ ] `.env.example` contains names/placeholders only.
- [ ] Workflow modules depend on logical provider interfaces.
- [ ] At least one AI provider can be selected through configuration.
- [ ] AI key rotation requires no workflow source-code change.
- [ ] Search, storage, and publishing credentials are independently configurable.
- [ ] Credential test endpoints never return secret values.
- [ ] Logs redact secrets and authorization headers.
- [ ] Affiliate/content forms do not ask for provider credentials.
- [ ] Provider failures are classified and surfaced safely.
