import { PartySocket } from "partysocket";
import { usePartySocket } from "partysocket/react";
import { MCPServersState, Agent } from "./index.js";
import { StreamOptions } from "./client.js";
import { Method, RPCMethod } from "./serializable.js";
import "@modelcontextprotocol/sdk/client/index.js";
import "@modelcontextprotocol/sdk/types.js";
import "partyserver";
import "./mcp/client.js";
import "zod";
import "@modelcontextprotocol/sdk/client/sse.js";
import "@modelcontextprotocol/sdk/shared/protocol.js";
import "ai";
import "./mcp/do-oauth-client-provider.js";
import "@modelcontextprotocol/sdk/client/auth.js";
import "@modelcontextprotocol/sdk/shared/auth.js";

/**
 * Options for the useAgent hook
 * @template State Type of the Agent's state
 */
type UseAgentOptions<State = unknown> = Omit<
  Parameters<typeof usePartySocket>[0],
  "party" | "room"
> & {
  /** Name of the agent to connect to */
  agent: string;
  /** Name of the specific Agent instance */
  name?: string;
  /** Called when the Agent's state is updated */
  onStateUpdate?: (state: State, source: "server" | "client") => void;
  /** Called when MCP server state is updated */
  onMcpUpdate?: (mcpServers: MCPServersState) => void;
};
type AllOptional<T> = T extends [infer A, ...infer R]
  ? undefined extends A
    ? AllOptional<R>
    : false
  : true;
type RPCMethods<T> = {
  [K in keyof T as T[K] extends RPCMethod<T[K]> ? K : never]: RPCMethod<T[K]>;
};
type OptionalParametersMethod<T extends RPCMethod> =
  AllOptional<Parameters<T>> extends true ? T : never;
type AgentMethods<T> = Omit<RPCMethods<T>, keyof Agent<any, any>>;
type OptionalAgentMethods<T> = {
  [K in keyof AgentMethods<T> as AgentMethods<T>[K] extends OptionalParametersMethod<
    AgentMethods<T>[K]
  >
    ? K
    : never]: OptionalParametersMethod<AgentMethods<T>[K]>;
};
type RequiredAgentMethods<T> = Omit<
  AgentMethods<T>,
  keyof OptionalAgentMethods<T>
>;
type AgentPromiseReturnType<T, K extends keyof AgentMethods<T>> =
  ReturnType<AgentMethods<T>[K]> extends Promise<any>
    ? ReturnType<AgentMethods<T>[K]>
    : Promise<ReturnType<AgentMethods<T>[K]>>;
type OptionalArgsAgentMethodCall<AgentT> = <
  K extends keyof OptionalAgentMethods<AgentT>,
>(
  method: K,
  args?: Parameters<OptionalAgentMethods<AgentT>[K]>,
  streamOptions?: StreamOptions
) => AgentPromiseReturnType<AgentT, K>;
type RequiredArgsAgentMethodCall<AgentT> = <
  K extends keyof RequiredAgentMethods<AgentT>,
>(
  method: K,
  args: Parameters<RequiredAgentMethods<AgentT>[K]>,
  streamOptions?: StreamOptions
) => AgentPromiseReturnType<AgentT, K>;
type AgentMethodCall<AgentT> = OptionalArgsAgentMethodCall<AgentT> &
  RequiredArgsAgentMethodCall<AgentT>;
type UntypedAgentMethodCall = <T = unknown>(
  method: string,
  args?: unknown[],
  streamOptions?: StreamOptions
) => Promise<T>;
type AgentStub<T> = {
  [K in keyof AgentMethods<T>]: (
    ...args: Parameters<AgentMethods<T>[K]>
  ) => AgentPromiseReturnType<AgentMethods<T>, K>;
};
type UntypedAgentStub = Record<string, Method>;
/**
 * React hook for connecting to an Agent
 * @template State Type of the Agent's state
 * @template Agent Type of the Agent
 * @param options Connection options
 * @returns WebSocket connection with setState and call methods
 */
declare function useAgent<State = unknown>(
  options: UseAgentOptions<State>
): PartySocket & {
  agent: string;
  name: string;
  setState: (state: State) => void;
  call: UntypedAgentMethodCall;
  stub: UntypedAgentStub;
};
declare function useAgent<
  AgentT extends {
    get state(): State;
  },
  State,
>(
  options: UseAgentOptions<State>
): PartySocket & {
  agent: string;
  name: string;
  setState: (state: State) => void;
  call: AgentMethodCall<AgentT>;
  stub: AgentStub<AgentT>;
};

export { type UseAgentOptions, useAgent };
