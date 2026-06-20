# agent-browser sandbox helpers

This example shows how to use `@agent-browser/sandbox` in two places:

- `eve/` uses Eve's `ctx.getSandbox()` and `agent/sandbox.ts`.
- `vercel/` uses `@vercel/sandbox` directly from a Node script.

The package installs `agent-browser` in the sandbox and runs commands there,
not in the serverless function or app runtime.

## Eve

Use the files in `eve/agent/` as the agent source:

```text
eve/agent/sandbox.ts
eve/agent/tools/browser_snapshot.ts
```

The sandbox bootstrap installs `agent-browser` and Chrome once into the sandbox
template. The tool then opens a URL and returns an accessibility snapshot.

## Vercel Sandbox

Run the direct Vercel example from this directory:

```bash
pnpm install
vercel link --yes --scope <team-or-user> --project <project>
vercel env pull .env.local --yes
node vercel/snapshot-url.mjs https://example.com
```

The script loads `.env.local` when it is present, so local runs can use the
OIDC token pulled by the Vercel CLI. On Vercel, the OIDC token is provided by
the runtime.

For production, create and reuse a Vercel Sandbox snapshot so fresh requests do
not reinstall system dependencies and Chrome.
