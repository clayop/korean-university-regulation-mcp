import * as ai from "ai";
import { Message } from "ai";
import { useChat } from "@ai-sdk/react";
import { useAgent } from "./react.js";
import "partysocket";
import "partysocket/react";
import "./index.js";
import "@modelcontextprotocol/sdk/client/index.js";
import "@modelcontextprotocol/sdk/types.js";
import "partyserver";
import "./mcp/client.js";
import "zod";
import "@modelcontextprotocol/sdk/client/sse.js";
import "@modelcontextprotocol/sdk/shared/protocol.js";
import "./mcp/do-oauth-client-provider.js";
import "@modelcontextprotocol/sdk/client/auth.js";
import "@modelcontextprotocol/sdk/shared/auth.js";
import "./client.js";
import "./serializable.js";

type GetInitialMessagesOptions = {
  agent: string;
  name: string;
  url: string;
};
/**
 * Options for the useAgentChat hook
 */
type UseAgentChatOptions<State> = Omit<
  Parameters<typeof useChat>[0] & {
    /** Agent connection from useAgent */
    agent: ReturnType<typeof useAgent<State>>;
    getInitialMessages?:
      | undefined
      | null
      | ((options: GetInitialMessagesOptions) => Promise<Message[]>);
  },
  "fetch"
>;
/**
 * React hook for building AI chat interfaces using an Agent
 * @param options Chat options including the agent connection
 * @returns Chat interface controls and state with added clearHistory method
 */
declare function useAgentChat<State = unknown>(
  options: UseAgentChatOptions<State>
): {
  /**
   * Clear chat history on both client and Agent
   */
  clearHistory: () => void;
  /**
   * Set the chat messages and synchronize with the Agent
   * @param messages New messages to set
   */
  setMessages: (messages: Message[]) => void;
  messages: ai.UIMessage[];
  error: undefined | Error;
  append: (
    message: Message | ai.CreateMessage,
    chatRequestOptions?: ai.ChatRequestOptions
  ) => Promise<string | null | undefined>;
  reload: (
    chatRequestOptions?: ai.ChatRequestOptions
  ) => Promise<string | null | undefined>;
  stop: () => void;
  experimental_resume: () => void;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ai.ChatRequestOptions
  ) => void;
  metadata?: Object;
  isLoading: boolean;
  status: "submitted" | "streaming" | "ready" | "error";
  data?: ai.JSONValue[];
  setData: (
    data:
      | ai.JSONValue[]
      | undefined
      | ((data: ai.JSONValue[] | undefined) => ai.JSONValue[] | undefined)
  ) => void;
  id: string;
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
};

export { useAgentChat };
