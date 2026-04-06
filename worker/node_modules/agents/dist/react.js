// src/react.tsx
import { usePartySocket } from "partysocket/react";
import { useCallback, useRef } from "react";
function camelCaseToKebabCase(str) {
  if (str === str.toUpperCase() && str !== str.toLowerCase()) {
    return str.toLowerCase().replace(/_/g, "-");
  }
  let kebabified = str.replace(
    /[A-Z]/g,
    (letter) => `-${letter.toLowerCase()}`
  );
  kebabified = kebabified.startsWith("-") ? kebabified.slice(1) : kebabified;
  return kebabified.replace(/_/g, "-").replace(/-$/, "");
}
function useAgent(options) {
  const agentNamespace = camelCaseToKebabCase(options.agent);
  const pendingCallsRef = useRef(
    /* @__PURE__ */ new Map()
  );
  const agent = usePartySocket({
    party: agentNamespace,
    prefix: "agents",
    room: options.name || "default",
    ...options,
    onMessage: (message) => {
      if (typeof message.data === "string") {
        let parsedMessage;
        try {
          parsedMessage = JSON.parse(message.data);
        } catch (_error) {
          return options.onMessage?.(message);
        }
        if (parsedMessage.type === "cf_agent_state") {
          options.onStateUpdate?.(parsedMessage.state, "server");
          return;
        }
        if (parsedMessage.type === "cf_agent_mcp_servers") {
          options.onMcpUpdate?.(parsedMessage.mcp);
          return;
        }
        if (parsedMessage.type === "rpc") {
          const response = parsedMessage;
          const pending = pendingCallsRef.current.get(response.id);
          if (!pending) return;
          if (!response.success) {
            pending.reject(new Error(response.error));
            pendingCallsRef.current.delete(response.id);
            pending.stream?.onError?.(response.error);
            return;
          }
          if ("done" in response) {
            if (response.done) {
              pending.resolve(response.result);
              pendingCallsRef.current.delete(response.id);
              pending.stream?.onDone?.(response.result);
            } else {
              pending.stream?.onChunk?.(response.result);
            }
          } else {
            pending.resolve(response.result);
            pendingCallsRef.current.delete(response.id);
          }
          return;
        }
      }
      options.onMessage?.(message);
    }
  });
  const call = useCallback(
    (method, args = [], streamOptions) => {
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).slice(2);
        pendingCallsRef.current.set(id, {
          reject,
          resolve,
          stream: streamOptions
        });
        const request = {
          args,
          id,
          method,
          type: "rpc"
        };
        agent.send(JSON.stringify(request));
      });
    },
    [agent]
  );
  agent.setState = (state) => {
    agent.send(JSON.stringify({ state, type: "cf_agent_state" }));
    options.onStateUpdate?.(state, "client");
  };
  agent.call = call;
  agent.agent = agentNamespace;
  agent.name = options.name || "default";
  agent.stub = new Proxy(
    {},
    {
      get: (_target, method) => {
        return (...args) => {
          return call(method, args);
        };
      }
    }
  );
  if (agent.agent !== agent.agent.toLowerCase()) {
    console.warn(
      `Agent name: ${agent.agent} should probably be in lowercase. Received: ${agent.agent}`
    );
  }
  return agent;
}
export {
  useAgent
};
//# sourceMappingURL=react.js.map