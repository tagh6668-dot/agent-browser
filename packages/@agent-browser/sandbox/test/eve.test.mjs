import assert from "node:assert/strict";
import test from "node:test";

import {
  agentBrowserRevalidationKey,
  buildAgentBrowserCommand,
  installAgentBrowser,
  runAgentBrowser,
} from "../dist/eve.js";

test("builds Eve revalidation key from install options", () => {
  assert.equal(
    agentBrowserRevalidationKey({ installSpec: "agent-browser@1.2.3", installSystemDependencies: true }),
    "agent-browser:agent-browser@1.2.3:browser:system-deps",
  );
});

test("builds Eve shell command", () => {
  assert.equal(
    buildAgentBrowserCommand(["open", "https://example.com"], { session: "s1" }),
    "agent-browser --session s1 open https://example.com --json",
  );
});

test("installs agent-browser in an Eve sandbox", async () => {
  const commands = [];
  const sandbox = {
    id: "sandbox-1",
    async run({ command }) {
      commands.push(command);
      return { exitCode: 0, stdout: "", stderr: "" };
    },
  };

  await installAgentBrowser(sandbox, { installSpec: "agent-browser@1.2.3", installSystemDependencies: true });

  assert.deepEqual(commands, [
    "npm install -g agent-browser@1.2.3",
    "agent-browser install --with-deps",
  ]);
});

test("runs agent-browser through ctx.getSandbox", async () => {
  const commands = [];
  const ctx = {
    async getSandbox() {
      return {
        id: "sandbox/id 1",
        async run({ command }) {
          commands.push(command);
          return { exitCode: 0, stdout: '{"ok":true}', stderr: "" };
        },
      };
    },
  };

  const result = await runAgentBrowser(ctx, ["open", "https://example.com"]);

  assert.deepEqual(result.json, { ok: true });
  assert.equal(commands[0], "agent-browser --session eve-sandbox-id-1 open https://example.com --json");
});

test("accepts Eve promise-like sandbox methods", async () => {
  const thenable = (value) => ({
    then(resolve) {
      resolve(value);
    },
  });
  const ctx = {
    getSandbox() {
      return thenable({
        id: "sandbox-1",
        run() {
          return thenable({ exitCode: 0, stdout: '{"ok":true}', stderr: "" });
        },
      });
    },
  };

  const result = await runAgentBrowser(ctx, ["snapshot"]);

  assert.deepEqual(result.json, { ok: true });
});

test("throws when Eve sandbox command fails", async () => {
  const ctx = {
    async getSandbox() {
      return {
        id: "sandbox-1",
        async run() {
          return { exitCode: 2, stdout: "", stderr: "no chrome" };
        },
      };
    },
  };

  await assert.rejects(() => runAgentBrowser(ctx, ["snapshot"]), /no chrome/);
});
