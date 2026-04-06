// src/mcp/client.ts
import { jsonSchema } from "ai";
import { nanoid } from "nanoid";

// src/mcp/client-connection.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  PromptListChangedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema
} from "@modelcontextprotocol/sdk/types.js";

// src/mcp/sse-edge.ts
import {
  SSEClientTransport
} from "@modelcontextprotocol/sdk/client/sse.js";
var SSEEdgeClientTransport = class extends SSEClientTransport {
  /**
   * Creates a new EdgeSSEClientTransport, which overrides fetch to be compatible with the CF workers environment
   */
  constructor(url, options) {
    const fetchOverride = async (fetchUrl, fetchInit = {}) => {
      const headers = await this.authHeaders();
      const workerOptions = {
        ...fetchInit,
        headers: {
          ...options.requestInit?.headers,
          ...fetchInit?.headers,
          ...headers
        }
      };
      delete workerOptions.mode;
      return options.eventSourceInit?.fetch?.(
        fetchUrl,
        // @ts-expect-error Expects FetchLikeInit from EventSource but is compatible with RequestInit
        workerOptions
      ) || fetch(fetchUrl, workerOptions);
    };
    super(url, {
      ...options,
      eventSourceInit: {
        ...options.eventSourceInit,
        fetch: fetchOverride
      }
    });
    this.authProvider = options.authProvider;
  }
  async authHeaders() {
    if (this.authProvider) {
      const tokens = await this.authProvider.tokens();
      if (tokens) {
        return {
          Authorization: `Bearer ${tokens.access_token}`
        };
      }
    }
  }
};

// src/mcp/client-connection.ts
var MCPClientConnection = class {
  constructor(url, info, options = { client: {}, transport: {} }) {
    this.url = url;
    this.options = options;
    this.connectionState = "connecting";
    this.tools = [];
    this.prompts = [];
    this.resources = [];
    this.resourceTemplates = [];
    this.client = new Client(info, options.client);
  }
  /**
   * Initialize a client connection
   *
   * @param code Optional OAuth code to initialize the connection with if auth hasn't been initialized
   * @returns
   */
  async init(code) {
    try {
      const transport = new SSEEdgeClientTransport(
        this.url,
        this.options.transport
      );
      if (code) {
        await transport.finishAuth(code);
      }
      await this.client.connect(transport);
    } catch (e) {
      if (e.toString().includes("Unauthorized")) {
        this.connectionState = "authenticating";
        return;
      }
      this.connectionState = "failed";
      throw e;
    }
    this.connectionState = "discovering";
    this.serverCapabilities = await this.client.getServerCapabilities();
    if (!this.serverCapabilities) {
      throw new Error("The MCP Server failed to return server capabilities");
    }
    const [instructions, tools, resources, prompts, resourceTemplates] = await Promise.all([
      this.client.getInstructions(),
      this.registerTools(),
      this.registerResources(),
      this.registerPrompts(),
      this.registerResourceTemplates()
    ]);
    this.instructions = instructions;
    this.tools = tools;
    this.resources = resources;
    this.prompts = prompts;
    this.resourceTemplates = resourceTemplates;
    this.connectionState = "ready";
  }
  /**
   * Notification handler registration
   */
  async registerTools() {
    if (!this.serverCapabilities || !this.serverCapabilities.tools) {
      return [];
    }
    if (this.serverCapabilities.tools.listChanged) {
      this.client.setNotificationHandler(
        ToolListChangedNotificationSchema,
        async (_notification) => {
          this.tools = await this.fetchTools();
        }
      );
    }
    return this.fetchTools();
  }
  async registerResources() {
    if (!this.serverCapabilities || !this.serverCapabilities.resources) {
      return [];
    }
    if (this.serverCapabilities.resources.listChanged) {
      this.client.setNotificationHandler(
        ResourceListChangedNotificationSchema,
        async (_notification) => {
          this.resources = await this.fetchResources();
        }
      );
    }
    return this.fetchResources();
  }
  async registerPrompts() {
    if (!this.serverCapabilities || !this.serverCapabilities.prompts) {
      return [];
    }
    if (this.serverCapabilities.prompts.listChanged) {
      this.client.setNotificationHandler(
        PromptListChangedNotificationSchema,
        async (_notification) => {
          this.prompts = await this.fetchPrompts();
        }
      );
    }
    return this.fetchPrompts();
  }
  async registerResourceTemplates() {
    if (!this.serverCapabilities || !this.serverCapabilities.resources) {
      return [];
    }
    return this.fetchResourceTemplates();
  }
  async fetchTools() {
    let toolsAgg = [];
    let toolsResult = { tools: [] };
    do {
      toolsResult = await this.client.listTools({
        cursor: toolsResult.nextCursor
      }).catch(capabilityErrorHandler({ tools: [] }, "tools/list"));
      toolsAgg = toolsAgg.concat(toolsResult.tools);
    } while (toolsResult.nextCursor);
    return toolsAgg;
  }
  async fetchResources() {
    let resourcesAgg = [];
    let resourcesResult = { resources: [] };
    do {
      resourcesResult = await this.client.listResources({
        cursor: resourcesResult.nextCursor
      }).catch(capabilityErrorHandler({ resources: [] }, "resources/list"));
      resourcesAgg = resourcesAgg.concat(resourcesResult.resources);
    } while (resourcesResult.nextCursor);
    return resourcesAgg;
  }
  async fetchPrompts() {
    let promptsAgg = [];
    let promptsResult = { prompts: [] };
    do {
      promptsResult = await this.client.listPrompts({
        cursor: promptsResult.nextCursor
      }).catch(capabilityErrorHandler({ prompts: [] }, "prompts/list"));
      promptsAgg = promptsAgg.concat(promptsResult.prompts);
    } while (promptsResult.nextCursor);
    return promptsAgg;
  }
  async fetchResourceTemplates() {
    let templatesAgg = [];
    let templatesResult = {
      resourceTemplates: []
    };
    do {
      templatesResult = await this.client.listResourceTemplates({
        cursor: templatesResult.nextCursor
      }).catch(
        capabilityErrorHandler(
          { resourceTemplates: [] },
          "resources/templates/list"
        )
      );
      templatesAgg = templatesAgg.concat(templatesResult.resourceTemplates);
    } while (templatesResult.nextCursor);
    return templatesAgg;
  }
};
function capabilityErrorHandler(empty, method) {
  return (e) => {
    if (e.code === -32601) {
      console.error(
        `The server advertised support for the capability ${method.split("/")[0]}, but returned "Method not found" for '${method}'.`
      );
      return empty;
    }
    throw e;
  };
}

// src/mcp/client.ts
var MCPClientManager = class {
  /**
   * @param _name Name of the MCP client
   * @param _version Version of the MCP Client
   * @param auth Auth paramters if being used to create a DurableObjectOAuthClientProvider
   */
  constructor(_name, _version) {
    this._name = _name;
    this._version = _version;
    this.mcpConnections = {};
    this._callbackUrls = [];
  }
  /**
   * Connect to and register an MCP server
   *
   * @param transportConfig Transport config
   * @param clientConfig Client config
   * @param capabilities Client capabilities (i.e. if the client supports roots/sampling)
   */
  async connect(url, options = {}) {
    const id = options.reconnect?.id ?? nanoid(8);
    if (!options.transport?.authProvider) {
      console.warn(
        "No authProvider provided in the transport options. This client will only support unauthenticated remote MCP Servers"
      );
    } else {
      options.transport.authProvider.serverId = id;
      if (options.reconnect?.oauthClientId) {
        options.transport.authProvider.clientId = options.reconnect?.oauthClientId;
      }
    }
    this.mcpConnections[id] = new MCPClientConnection(
      new URL(url),
      {
        name: this._name,
        version: this._version
      },
      {
        client: options.client ?? {},
        transport: options.transport ?? {}
      }
    );
    await this.mcpConnections[id].init(options.reconnect?.oauthCode);
    const authUrl = options.transport?.authProvider?.authUrl;
    if (authUrl && options.transport?.authProvider?.redirectUrl) {
      this._callbackUrls.push(
        options.transport.authProvider.redirectUrl.toString()
      );
      return {
        authUrl,
        clientId: options.transport?.authProvider?.clientId,
        id
      };
    }
    return {
      id
    };
  }
  isCallbackRequest(req) {
    return req.method === "GET" && !!this._callbackUrls.find((url) => {
      return req.url.startsWith(url);
    });
  }
  async handleCallbackRequest(req) {
    const url = new URL(req.url);
    const urlMatch = this._callbackUrls.find((url2) => {
      return req.url.startsWith(url2);
    });
    if (!urlMatch) {
      throw new Error(
        `No callback URI match found for the request url: ${req.url}. Was the request matched with \`isCallbackRequest()\`?`
      );
    }
    const code = url.searchParams.get("code");
    const clientId = url.searchParams.get("state");
    const urlParams = urlMatch.split("/");
    const serverId = urlParams[urlParams.length - 1];
    if (!code) {
      throw new Error("Unauthorized: no code provided");
    }
    if (!clientId) {
      throw new Error("Unauthorized: no state provided");
    }
    if (this.mcpConnections[serverId] === void 0) {
      throw new Error(`Could not find serverId: ${serverId}`);
    }
    if (this.mcpConnections[serverId].connectionState !== "authenticating") {
      throw new Error(
        "Failed to authenticate: the client isn't in the `authenticating` state"
      );
    }
    const conn = this.mcpConnections[serverId];
    if (!conn.options.transport.authProvider) {
      throw new Error(
        "Trying to finalize authentication for a server connection without an authProvider"
      );
    }
    conn.options.transport.authProvider.clientId = clientId;
    conn.options.transport.authProvider.serverId = serverId;
    const serverUrl = conn.url.toString();
    await this.connect(serverUrl, {
      reconnect: {
        id: serverId,
        oauthClientId: clientId,
        oauthCode: code
      },
      ...conn.options
    });
    if (this.mcpConnections[serverId].connectionState === "authenticating") {
      throw new Error("Failed to authenticate: client failed to initialize");
    }
    return { serverId };
  }
  /**
   * @returns namespaced list of tools
   */
  listTools() {
    return getNamespacedData(this.mcpConnections, "tools");
  }
  /**
   * @returns a set of tools that you can use with the AI SDK
   */
  unstable_getAITools() {
    return Object.fromEntries(
      getNamespacedData(this.mcpConnections, "tools").map((tool) => {
        return [
          `${tool.serverId}_${tool.name}`,
          {
            description: tool.description,
            execute: async (args) => {
              const result = await this.callTool({
                arguments: args,
                name: tool.name,
                serverId: tool.serverId
              });
              if (result.isError) {
                throw new Error(result.content[0].text);
              }
              return result;
            },
            parameters: jsonSchema(tool.inputSchema)
          }
        ];
      })
    );
  }
  /**
   * Closes all connections to MCP servers
   */
  async closeAllConnections() {
    return Promise.all(
      Object.values(this.mcpConnections).map(async (connection) => {
        await connection.client.close();
      })
    );
  }
  /**
   * Closes a connection to an MCP server
   * @param id The id of the connection to close
   */
  async closeConnection(id) {
    if (!this.mcpConnections[id]) {
      throw new Error(`Connection with id "${id}" does not exist.`);
    }
    await this.mcpConnections[id].client.close();
    delete this.mcpConnections[id];
  }
  /**
   * @returns namespaced list of prompts
   */
  listPrompts() {
    return getNamespacedData(this.mcpConnections, "prompts");
  }
  /**
   * @returns namespaced list of tools
   */
  listResources() {
    return getNamespacedData(this.mcpConnections, "resources");
  }
  /**
   * @returns namespaced list of resource templates
   */
  listResourceTemplates() {
    return getNamespacedData(this.mcpConnections, "resourceTemplates");
  }
  /**
   * Namespaced version of callTool
   */
  callTool(params, resultSchema, options) {
    const unqualifiedName = params.name.replace(`${params.serverId}.`, "");
    return this.mcpConnections[params.serverId].client.callTool(
      {
        ...params,
        name: unqualifiedName
      },
      resultSchema,
      options
    );
  }
  /**
   * Namespaced version of readResource
   */
  readResource(params, options) {
    return this.mcpConnections[params.serverId].client.readResource(
      params,
      options
    );
  }
  /**
   * Namespaced version of getPrompt
   */
  getPrompt(params, options) {
    return this.mcpConnections[params.serverId].client.getPrompt(
      params,
      options
    );
  }
};
function getNamespacedData(mcpClients, type) {
  const sets = Object.entries(mcpClients).map(([name, conn]) => {
    return { data: conn[type], name };
  });
  const namespacedData = sets.flatMap(({ name: serverId, data }) => {
    return data.map((item) => {
      return {
        ...item,
        // we add a serverId so we can easily pull it out and send the tool call to the right server
        serverId
      };
    });
  });
  return namespacedData;
}

export {
  MCPClientManager,
  getNamespacedData
};
//# sourceMappingURL=chunk-E3LCYPCB.js.map