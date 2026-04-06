// src/client.ts
import {
  PartySocket
} from "partysocket";
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
var AgentClient = class extends PartySocket {
  constructor(options) {
    const agentNamespace = camelCaseToKebabCase(options.agent);
    super({
      party: agentNamespace,
      prefix: "agents",
      room: options.name || "default",
      ...options
    });
    this._pendingCalls = /* @__PURE__ */ new Map();
    this.agent = agentNamespace;
    this.name = options.name || "default";
    this.options = options;
    this.addEventListener("message", (event) => {
      if (typeof event.data === "string") {
        let parsedMessage;
        try {
          parsedMessage = JSON.parse(event.data);
        } catch (_error) {
          return;
        }
        if (parsedMessage.type === "cf_agent_state") {
          this.options.onStateUpdate?.(parsedMessage.state, "server");
          return;
        }
        if (parsedMessage.type === "rpc") {
          const response = parsedMessage;
          const pending = this._pendingCalls.get(response.id);
          if (!pending) return;
          if (!response.success) {
            pending.reject(new Error(response.error));
            this._pendingCalls.delete(response.id);
            pending.stream?.onError?.(response.error);
            return;
          }
          if ("done" in response) {
            if (response.done) {
              pending.resolve(response.result);
              this._pendingCalls.delete(response.id);
              pending.stream?.onDone?.(response.result);
            } else {
              pending.stream?.onChunk?.(response.result);
            }
          } else {
            pending.resolve(response.result);
            this._pendingCalls.delete(response.id);
          }
        }
      }
    });
  }
  /**
   * @deprecated Use agentFetch instead
   */
  static fetch(_opts) {
    throw new Error(
      "AgentClient.fetch is not implemented, use agentFetch instead"
    );
  }
  setState(state) {
    this.send(JSON.stringify({ state, type: "cf_agent_state" }));
    this.options.onStateUpdate?.(state, "client");
  }
  async call(method, args = [], streamOptions) {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2);
      this._pendingCalls.set(id, {
        reject,
        resolve: (value) => resolve(value),
        stream: streamOptions,
        type: null
      });
      const request = {
        args,
        id,
        method,
        type: "rpc"
      };
      this.send(JSON.stringify(request));
    });
  }
};
function agentFetch(opts, init) {
  const agentNamespace = camelCaseToKebabCase(opts.agent);
  return PartySocket.fetch(
    {
      party: agentNamespace,
      prefix: "agents",
      room: opts.name || "default",
      ...opts
    },
    init
  );
}

export {
  camelCaseToKebabCase,
  AgentClient,
  agentFetch
};
//# sourceMappingURL=chunk-NKZZ66QY.js.map