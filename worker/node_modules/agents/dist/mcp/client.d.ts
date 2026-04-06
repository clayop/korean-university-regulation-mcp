import * as zod from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransportOptions } from '@modelcontextprotocol/sdk/client/sse.js';
import { RequestOptions } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { Tool, Prompt, Resource, ResourceTemplate, ServerCapabilities, CallToolRequest, CallToolResultSchema, CompatibilityCallToolResultSchema, ReadResourceRequest, GetPromptRequest } from '@modelcontextprotocol/sdk/types.js';
import { ToolSet } from 'ai';
import { AgentsOAuthProvider } from './do-oauth-client-provider.js';
import '@modelcontextprotocol/sdk/client/auth.js';
import '@modelcontextprotocol/sdk/shared/auth.js';

declare class MCPClientConnection {
    url: URL;
    options: {
        transport: SSEClientTransportOptions & {
            authProvider?: AgentsOAuthProvider;
        };
        client: ConstructorParameters<typeof Client>[1];
    };
    client: Client;
    connectionState: "authenticating" | "connecting" | "ready" | "discovering" | "failed";
    instructions?: string;
    tools: Tool[];
    prompts: Prompt[];
    resources: Resource[];
    resourceTemplates: ResourceTemplate[];
    serverCapabilities: ServerCapabilities | undefined;
    constructor(url: URL, info: ConstructorParameters<typeof Client>[0], options?: {
        transport: SSEClientTransportOptions & {
            authProvider?: AgentsOAuthProvider;
        };
        client: ConstructorParameters<typeof Client>[1];
    });
    /**
     * Initialize a client connection
     *
     * @param code Optional OAuth code to initialize the connection with if auth hasn't been initialized
     * @returns
     */
    init(code?: string): Promise<void>;
    /**
     * Notification handler registration
     */
    registerTools(): Promise<Tool[]>;
    registerResources(): Promise<Resource[]>;
    registerPrompts(): Promise<Prompt[]>;
    registerResourceTemplates(): Promise<ResourceTemplate[]>;
    fetchTools(): Promise<{
        [x: string]: unknown;
        name: string;
        inputSchema: {
            [x: string]: unknown;
            type: "object";
            properties?: {
                [x: string]: unknown;
            } | undefined;
        };
        description?: string | undefined;
        annotations?: {
            [x: string]: unknown;
            title?: string | undefined;
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
    }[]>;
    fetchResources(): Promise<{
        [x: string]: unknown;
        name: string;
        uri: string;
        description?: string | undefined;
        mimeType?: string | undefined;
    }[]>;
    fetchPrompts(): Promise<{
        [x: string]: unknown;
        name: string;
        description?: string | undefined;
        arguments?: {
            [x: string]: unknown;
            name: string;
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
    }[]>;
    fetchResourceTemplates(): Promise<{
        [x: string]: unknown;
        name: string;
        uriTemplate: string;
        description?: string | undefined;
        mimeType?: string | undefined;
    }[]>;
}

/**
 * Utility class that aggregates multiple MCP clients into one
 */
declare class MCPClientManager {
    private _name;
    private _version;
    mcpConnections: Record<string, MCPClientConnection>;
    private _callbackUrls;
    /**
     * @param _name Name of the MCP client
     * @param _version Version of the MCP Client
     * @param auth Auth paramters if being used to create a DurableObjectOAuthClientProvider
     */
    constructor(_name: string, _version: string);
    /**
     * Connect to and register an MCP server
     *
     * @param transportConfig Transport config
     * @param clientConfig Client config
     * @param capabilities Client capabilities (i.e. if the client supports roots/sampling)
     */
    connect(url: string, options?: {
        reconnect?: {
            id: string;
            oauthClientId?: string;
            oauthCode?: string;
        };
        transport?: SSEClientTransportOptions & {
            authProvider?: AgentsOAuthProvider;
        };
        client?: ConstructorParameters<typeof Client>[1];
    }): Promise<{
        id: string;
        authUrl?: string;
        clientId?: string;
    }>;
    isCallbackRequest(req: Request): boolean;
    handleCallbackRequest(req: Request): Promise<{
        serverId: string;
    }>;
    /**
     * @returns namespaced list of tools
     */
    listTools(): NamespacedData["tools"];
    /**
     * @returns a set of tools that you can use with the AI SDK
     */
    unstable_getAITools(): ToolSet;
    /**
     * Closes all connections to MCP servers
     */
    closeAllConnections(): Promise<void[]>;
    /**
     * Closes a connection to an MCP server
     * @param id The id of the connection to close
     */
    closeConnection(id: string): Promise<void>;
    /**
     * @returns namespaced list of prompts
     */
    listPrompts(): NamespacedData["prompts"];
    /**
     * @returns namespaced list of tools
     */
    listResources(): NamespacedData["resources"];
    /**
     * @returns namespaced list of resource templates
     */
    listResourceTemplates(): NamespacedData["resourceTemplates"];
    /**
     * Namespaced version of callTool
     */
    callTool(params: CallToolRequest["params"] & {
        serverId: string;
    }, resultSchema?: typeof CallToolResultSchema | typeof CompatibilityCallToolResultSchema, options?: RequestOptions): Promise<zod.objectOutputType<{
        _meta: zod.ZodOptional<zod.ZodObject<{}, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{}, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{}, zod.ZodTypeAny, "passthrough">>>;
    } & {
        content: zod.ZodArray<zod.ZodUnion<[zod.ZodObject<{
            type: zod.ZodLiteral<"text">;
            text: zod.ZodString;
        }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
            type: zod.ZodLiteral<"text">;
            text: zod.ZodString;
        }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
            type: zod.ZodLiteral<"text">;
            text: zod.ZodString;
        }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
            type: zod.ZodLiteral<"image">;
            data: zod.ZodString;
            mimeType: zod.ZodString;
        }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
            type: zod.ZodLiteral<"image">;
            data: zod.ZodString;
            mimeType: zod.ZodString;
        }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
            type: zod.ZodLiteral<"image">;
            data: zod.ZodString;
            mimeType: zod.ZodString;
        }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
            type: zod.ZodLiteral<"audio">;
            data: zod.ZodString;
            mimeType: zod.ZodString;
        }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
            type: zod.ZodLiteral<"audio">;
            data: zod.ZodString;
            mimeType: zod.ZodString;
        }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
            type: zod.ZodLiteral<"audio">;
            data: zod.ZodString;
            mimeType: zod.ZodString;
        }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
            type: zod.ZodLiteral<"resource">;
            resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                text: zod.ZodString;
            }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                text: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                text: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                blob: zod.ZodString;
            }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                blob: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                blob: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">>]>;
        }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
            type: zod.ZodLiteral<"resource">;
            resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                text: zod.ZodString;
            }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                text: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                text: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                blob: zod.ZodString;
            }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                blob: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                blob: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">>]>;
        }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
            type: zod.ZodLiteral<"resource">;
            resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                text: zod.ZodString;
            }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                text: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                text: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                blob: zod.ZodString;
            }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                blob: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                uri: zod.ZodString;
                mimeType: zod.ZodOptional<zod.ZodString>;
            }, {
                blob: zod.ZodString;
            }>, zod.ZodTypeAny, "passthrough">>]>;
        }, zod.ZodTypeAny, "passthrough">>]>, "many">;
        isError: zod.ZodOptional<zod.ZodDefault<zod.ZodBoolean>>;
    }, zod.ZodTypeAny, "passthrough"> | zod.objectOutputType<{
        _meta: zod.ZodOptional<zod.ZodObject<{}, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{}, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{}, zod.ZodTypeAny, "passthrough">>>;
    } & {
        toolResult: zod.ZodUnknown;
    }, zod.ZodTypeAny, "passthrough">>;
    /**
     * Namespaced version of readResource
     */
    readResource(params: ReadResourceRequest["params"] & {
        serverId: string;
    }, options: RequestOptions): Promise<zod.objectOutputType<{
        _meta: zod.ZodOptional<zod.ZodObject<{}, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{}, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{}, zod.ZodTypeAny, "passthrough">>>;
    } & {
        contents: zod.ZodArray<zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
            uri: zod.ZodString;
            mimeType: zod.ZodOptional<zod.ZodString>;
        }, {
            text: zod.ZodString;
        }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
            uri: zod.ZodString;
            mimeType: zod.ZodOptional<zod.ZodString>;
        }, {
            text: zod.ZodString;
        }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
            uri: zod.ZodString;
            mimeType: zod.ZodOptional<zod.ZodString>;
        }, {
            text: zod.ZodString;
        }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
            uri: zod.ZodString;
            mimeType: zod.ZodOptional<zod.ZodString>;
        }, {
            blob: zod.ZodString;
        }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
            uri: zod.ZodString;
            mimeType: zod.ZodOptional<zod.ZodString>;
        }, {
            blob: zod.ZodString;
        }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
            uri: zod.ZodString;
            mimeType: zod.ZodOptional<zod.ZodString>;
        }, {
            blob: zod.ZodString;
        }>, zod.ZodTypeAny, "passthrough">>]>, "many">;
    }, zod.ZodTypeAny, "passthrough">>;
    /**
     * Namespaced version of getPrompt
     */
    getPrompt(params: GetPromptRequest["params"] & {
        serverId: string;
    }, options: RequestOptions): Promise<zod.objectOutputType<{
        _meta: zod.ZodOptional<zod.ZodObject<{}, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{}, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{}, zod.ZodTypeAny, "passthrough">>>;
    } & {
        description: zod.ZodOptional<zod.ZodString>;
        messages: zod.ZodArray<zod.ZodObject<{
            role: zod.ZodEnum<["user", "assistant"]>;
            content: zod.ZodUnion<[zod.ZodObject<{
                type: zod.ZodLiteral<"text">;
                text: zod.ZodString;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"text">;
                text: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"text">;
                text: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
                type: zod.ZodLiteral<"image">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"image">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"image">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
                type: zod.ZodLiteral<"audio">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"audio">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"audio">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
                type: zod.ZodLiteral<"resource">;
                resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>]>;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"resource">;
                resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>]>;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"resource">;
                resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>]>;
            }, zod.ZodTypeAny, "passthrough">>]>;
        }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
            role: zod.ZodEnum<["user", "assistant"]>;
            content: zod.ZodUnion<[zod.ZodObject<{
                type: zod.ZodLiteral<"text">;
                text: zod.ZodString;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"text">;
                text: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"text">;
                text: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
                type: zod.ZodLiteral<"image">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"image">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"image">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
                type: zod.ZodLiteral<"audio">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"audio">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"audio">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
                type: zod.ZodLiteral<"resource">;
                resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>]>;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"resource">;
                resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>]>;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"resource">;
                resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>]>;
            }, zod.ZodTypeAny, "passthrough">>]>;
        }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
            role: zod.ZodEnum<["user", "assistant"]>;
            content: zod.ZodUnion<[zod.ZodObject<{
                type: zod.ZodLiteral<"text">;
                text: zod.ZodString;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"text">;
                text: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"text">;
                text: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
                type: zod.ZodLiteral<"image">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"image">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"image">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
                type: zod.ZodLiteral<"audio">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"audio">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"audio">;
                data: zod.ZodString;
                mimeType: zod.ZodString;
            }, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<{
                type: zod.ZodLiteral<"resource">;
                resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>]>;
            }, "passthrough", zod.ZodTypeAny, zod.objectOutputType<{
                type: zod.ZodLiteral<"resource">;
                resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>]>;
            }, zod.ZodTypeAny, "passthrough">, zod.objectInputType<{
                type: zod.ZodLiteral<"resource">;
                resource: zod.ZodUnion<[zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    text: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>, zod.ZodObject<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, "passthrough", zod.ZodTypeAny, zod.objectOutputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">, zod.objectInputType<zod.objectUtil.extendShape<{
                    uri: zod.ZodString;
                    mimeType: zod.ZodOptional<zod.ZodString>;
                }, {
                    blob: zod.ZodString;
                }>, zod.ZodTypeAny, "passthrough">>]>;
            }, zod.ZodTypeAny, "passthrough">>]>;
        }, zod.ZodTypeAny, "passthrough">>, "many">;
    }, zod.ZodTypeAny, "passthrough">>;
}
type NamespacedData = {
    tools: (Tool & {
        serverId: string;
    })[];
    prompts: (Prompt & {
        serverId: string;
    })[];
    resources: (Resource & {
        serverId: string;
    })[];
    resourceTemplates: (ResourceTemplate & {
        serverId: string;
    })[];
};
declare function getNamespacedData<T extends keyof NamespacedData>(mcpClients: Record<string, MCPClientConnection>, type: T): NamespacedData[T];

export { MCPClientManager, getNamespacedData };
