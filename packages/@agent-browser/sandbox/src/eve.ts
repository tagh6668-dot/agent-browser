import {
  buildShellCommand,
  createAgentBrowserCommandResult,
  defaultSessionName,
  quoteShellArg,
  resolveAgentBrowserInstallSpec,
  throwIfCommandFailed,
  type AgentBrowserArgs,
  type AgentBrowserCommandResult,
  type AgentBrowserInstallOptions,
  type BuildShellCommandOptions,
} from "./shared.js";

export {
  AgentBrowserCommandError,
  DEFAULT_AGENT_BROWSER_INSTALL_SPEC,
  buildAgentBrowserArgv,
  quoteShellArg,
  resolveAgentBrowserInstallSpec,
  type AgentBrowserCommandResult,
  type AgentBrowserInstallOptions,
} from "./index.js";

export interface EveSandboxCommandResult {
  readonly exitCode?: number;
  readonly stderr?: string;
  readonly stdout?: string;
}

export interface EveSandboxSession {
  readonly id: string;
  run(options: { readonly abortSignal?: AbortSignal; readonly command: string }): PromiseLike<EveSandboxCommandResult>;
}

export interface EveToolContext {
  getSandbox(): PromiseLike<EveSandboxSession | null>;
}

export interface EveInstallAgentBrowserOptions extends AgentBrowserInstallOptions {
  readonly abortSignal?: AbortSignal;
  readonly npmBinary?: string;
}

export interface EveRunAgentBrowserOptions extends Omit<BuildShellCommandOptions, "session"> {
  readonly abortSignal?: AbortSignal;
  readonly session?: string;
  readonly sessionPrefix?: string;
}

export function agentBrowserRevalidationKey(options: AgentBrowserInstallOptions = {}): string {
  return [
    "agent-browser",
    resolveAgentBrowserInstallSpec(options),
    options.installBrowser === false ? "no-browser" : "browser",
    options.installSystemDependencies === true ? "system-deps" : "no-system-deps",
  ].join(":");
}

export async function installAgentBrowser(
  sandbox: EveSandboxSession,
  options: EveInstallAgentBrowserOptions = {},
): Promise<AgentBrowserCommandResult[]> {
  const npmBinary = options.npmBinary ?? "npm";
  const installSpec = resolveAgentBrowserInstallSpec(options);
  const commands = [`${quoteShellArg(npmBinary)} install -g ${quoteShellArg(installSpec)}`];

  if (options.installBrowser !== false) {
    const installArgs = options.installSystemDependencies === true ? ["install", "--with-deps"] : ["install"];
    commands.push(buildShellCommand(installArgs, { binary: "agent-browser", json: false }));
  }

  const results: AgentBrowserCommandResult[] = [];
  for (const command of commands) {
    const result = await sandbox.run({ abortSignal: options.abortSignal, command });
    results.push(
      throwIfCommandFailed(
        createAgentBrowserCommandResult({
          command,
          exitCode: result.exitCode,
          stderr: result.stderr,
          stdout: result.stdout,
        }),
      ),
    );
  }
  return results;
}

export async function runAgentBrowser<TJson = unknown>(
  ctx: EveToolContext,
  args: AgentBrowserArgs,
  options: EveRunAgentBrowserOptions = {},
): Promise<AgentBrowserCommandResult<TJson>> {
  const sandbox = await ctx.getSandbox();
  if (sandbox === null) {
    throw new Error("agent-browser requires an Eve sandbox. Configure agent/sandbox.ts first.");
  }

  const session = options.session ?? defaultSessionName(options.sessionPrefix ?? "eve", sandbox.id);
  const command = buildAgentBrowserCommand(args, { ...options, session });
  const result = await sandbox.run({ abortSignal: options.abortSignal, command });

  return throwIfCommandFailed(
    createAgentBrowserCommandResult<TJson>({
      command,
      exitCode: result.exitCode,
      stderr: result.stderr,
      stdout: result.stdout,
    }),
  );
}

export function buildAgentBrowserCommand(
  args: AgentBrowserArgs,
  options: EveRunAgentBrowserOptions = {},
): string {
  return buildShellCommand(args, options);
}
