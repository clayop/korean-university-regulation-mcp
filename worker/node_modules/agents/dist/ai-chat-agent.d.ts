import { Message, StreamTextOnFinishCallback, ToolSet } from "ai";
import { Agent, AgentContext } from "./index.js";
import { Connection, WSMessage } from "partyserver";
import "@modelcontextprotocol/sdk/client/index.js";
import "@modelcontextprotocol/sdk/types.js";
import "./mcp/client.js";
import "zod";
import "@modelcontextprotocol/sdk/client/sse.js";
import "@modelcontextprotocol/sdk/shared/protocol.js";
import "./mcp/do-oauth-client-provider.js";
import "@modelcontextprotocol/sdk/client/auth.js";
import "@modelcontextprotocol/sdk/shared/auth.js";

/**
 * Extension of Agent with built-in chat capabilities
 * @template Env Environment type containing bindings
 */
declare class AIChatAgent<Env = unknown, State = unknown> extends Agent<
  Env,
  State
> {
  /**
   * Map of message `id`s to `AbortController`s
   * useful to propagate request cancellation signals for any external calls made by the agent
   */
  private _chatMessageAbortControllers;
  /** Array of chat messages for the current conversation */
  messages: Message[];
  constructor(ctx: AgentContext, env: Env);
  private _broadcastChatMessage;
  onMessage(connection: Connection, message: WSMessage): Promise<void>;
  onRequest(request: Request): Promise<Response>;
  private _tryCatchChat;
  /**
   * Handle incoming chat messages and generate a response
   * @param onFinish Callback to be called when the response is finished
   * @param options.signal A signal to pass to any child requests which can be used to cancel them
   * @returns Response to send to the client or undefined
   */
  onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: {
      abortSignal: AbortSignal | undefined;
    }
  ): Promise<Response | undefined>;
  /**
   * Save messages on the server side and trigger AI response
   * @param messages Chat messages to save
   */
  saveMessages(messages: Message[]): Promise<void>;
  persistMessages(
    messages: Message[],
    excludeBroadcastIds?: string[]
  ): Promise<void>;
  private _reply;
  /**
   * For the given message id, look up its associated AbortController
   * If the AbortController does not exist, create and store one in memory
   *
   * returns the AbortSignal associated with the AbortController
   */
  private _getAbortSignal;
  /**
   * Remove an abort controller from the cache of pending message responses
   */
  private _removeAbortController;
  /**
   * Propagate an abort signal for any requests associated with the given message id
   */
  private _cancelChatRequest;
  /**
   * Abort all pending requests and clear the cache of AbortControllers
   */
  private _destroyAbortControllers;
  /**
   * When the DO is destroyed, cancel all pending requests
   */
  destroy(): Promise<void>;
}

export { AIChatAgent };
