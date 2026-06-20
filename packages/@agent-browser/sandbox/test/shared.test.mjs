import assert from "node:assert/strict";
import test from "node:test";

import {
  AGENT_BROWSER_SANDBOX_VERSION,
  DEFAULT_AGENT_BROWSER_INSTALL_SPEC,
  buildAgentBrowserArgv,
  buildShellCommand,
  defaultSessionName,
  quoteShellArg,
  resolveAgentBrowserInstallSpec,
} from "../dist/index.js";

test("defaults install spec to the package version", () => {
  assert.equal(AGENT_BROWSER_SANDBOX_VERSION, "0.28.0");
  assert.equal(DEFAULT_AGENT_BROWSER_INSTALL_SPEC, "agent-browser@0.28.0");
  assert.equal(resolveAgentBrowserInstallSpec(), "agent-browser@0.28.0");
  assert.equal(resolveAgentBrowserInstallSpec({ installSpec: "latest" }), "latest");
});

test("builds argv with session and json by default", () => {
  assert.deepEqual(buildAgentBrowserArgv(["open", "https://example.com"], { session: "s1" }), [
    "--session",
    "s1",
    "open",
    "https://example.com",
    "--json",
  ]);

  assert.deepEqual(buildAgentBrowserArgv(["snapshot", "--json"], { session: "s1" }), [
    "--session",
    "s1",
    "snapshot",
    "--json",
  ]);
});

test("quotes shell args and builds commands", () => {
  assert.equal(quoteShellArg("simple"), "simple");
  assert.equal(quoteShellArg("hello world"), "'hello world'");
  assert.equal(quoteShellArg("can't"), "'can'\\''t'");

  assert.equal(
    buildShellCommand(["open", "https://example.com/a b"], {
      env: { AGENT_BROWSER_HOME: "/tmp/agent browser" },
      session: "s1",
    }),
    "AGENT_BROWSER_HOME='/tmp/agent browser' agent-browser --session s1 open 'https://example.com/a b' --json",
  );
});

test("sanitizes default session names", () => {
  assert.equal(defaultSessionName("eve", "sandbox/id 1"), "eve-sandbox-id-1");
});
