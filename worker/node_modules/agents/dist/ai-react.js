// src/ai-react.tsx
import { useChat } from "@ai-sdk/react";
import { nanoid } from "nanoid";
import { use, useEffect } from "react";
var requestCache = /* @__PURE__ */ new Map();
function useAgentChat(options) {
  const { agent, getInitialMessages, ...rest } = options;
  const agentUrl = new URL(
    `${// @ts-expect-error we're using a protected _url property that includes query params
    (agent._url || agent._pkurl)?.replace("ws://", "http://").replace("wss://", "https://")}`
  );
  agentUrl.searchParams.delete("_pk");
  const agentUrlString = agentUrl.toString();
  async function defaultGetInitialMessagesFetch({
    url
  }) {
    const getMessagesUrl = new URL(url);
    getMessagesUrl.pathname += "/get-messages";
    const response = await fetch(getMessagesUrl.toString(), {
      credentials: options.credentials,
      headers: options.headers
    });
    return response.json();
  }
  const getInitialMessagesFetch = getInitialMessages || defaultGetInitialMessagesFetch;
  function doGetInitialMessages(getInitialMessagesOptions) {
    if (requestCache.has(agentUrlString)) {
      return requestCache.get(agentUrlString);
    }
    const promise = getInitialMessagesFetch(getInitialMessagesOptions);
    requestCache.set(agentUrlString, promise);
    return promise;
  }
  const initialMessagesPromise = getInitialMessages === null ? null : doGetInitialMessages({
    agent: agent.agent,
    name: agent.name,
    url: agentUrlString
  });
  const initialMessages = initialMessagesPromise ? use(initialMessagesPromise) : rest.initialMessages ?? [];
  useEffect(() => {
    if (!initialMessagesPromise) {
      return;
    }
    requestCache.set(agentUrlString, initialMessagesPromise);
    return () => {
      if (requestCache.get(agentUrlString) === initialMessagesPromise) {
        requestCache.delete(agentUrlString);
      }
    };
  }, [agentUrlString, initialMessagesPromise]);
  async function aiFetch(request, options2 = {}) {
    const {
      method,
      keepalive,
      headers,
      body,
      redirect,
      integrity,
      signal,
      credentials,
      mode,
      referrer,
      referrerPolicy,
      window
      //  dispatcher, duplex
    } = options2;
    const id = nanoid(8);
    const abortController = new AbortController();
    signal?.addEventListener("abort", () => {
      agent.send(
        JSON.stringify({
          id,
          type: "cf_agent_chat_request_cancel"
        })
      );
      abortController.abort();
      controller.close();
    });
    agent.addEventListener(
      "message",
      (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (_error) {
          return;
        }
        if (data.type === "cf_agent_use_chat_response") {
          if (data.id === id) {
            controller.enqueue(new TextEncoder().encode(data.body));
            if (data.done) {
              controller.close();
              abortController.abort();
            }
          }
        }
      },
      { signal: abortController.signal }
    );
    let controller;
    const stream = new ReadableStream({
      start(c) {
        controller = c;
      }
    });
    agent.send(
      JSON.stringify({
        id,
        init: {
          body,
          credentials,
          headers,
          integrity,
          keepalive,
          method,
          mode,
          redirect,
          referrer,
          referrerPolicy,
          window
          // dispatcher,
          // duplex
        },
        type: "cf_agent_use_chat_request",
        url: request.toString()
      })
    );
    return new Response(stream);
  }
  const useChatHelpers = useChat({
    fetch: aiFetch,
    initialMessages,
    sendExtraMessageFields: true,
    ...rest
  });
  useEffect(() => {
    function onClearHistory(event) {
      if (typeof event.data !== "string") {
        return;
      }
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (_error) {
        return;
      }
      if (data.type === "cf_agent_chat_clear") {
        useChatHelpers.setMessages([]);
      }
    }
    function onMessages(event) {
      if (typeof event.data !== "string") {
        return;
      }
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (_error) {
        return;
      }
      if (data.type === "cf_agent_chat_messages") {
        useChatHelpers.setMessages(data.messages);
      }
    }
    agent.addEventListener("message", onClearHistory);
    agent.addEventListener("message", onMessages);
    return () => {
      agent.removeEventListener("message", onClearHistory);
      agent.removeEventListener("message", onMessages);
    };
  }, [agent, useChatHelpers.setMessages]);
  return {
    ...useChatHelpers,
    /**
     * Clear chat history on both client and Agent
     */
    clearHistory: () => {
      useChatHelpers.setMessages([]);
      agent.send(
        JSON.stringify({
          type: "cf_agent_chat_clear"
        })
      );
    },
    /**
     * Set the chat messages and synchronize with the Agent
     * @param messages New messages to set
     */
    setMessages: (messages) => {
      useChatHelpers.setMessages(messages);
      agent.send(
        JSON.stringify({
          messages,
          type: "cf_agent_chat_messages"
        })
      );
    }
  };
}
export {
  useAgentChat
};
//# sourceMappingURL=ai-react.js.map