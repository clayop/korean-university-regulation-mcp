import { MCPClientManager } from './client.js';
import { DurableObject } from 'cloudflare:workers';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Connection, WSMessage } from 'partyserver';
import 'zod';
import '@modelcontextprotocol/sdk/client/index.js';
import '@modelcontextprotocol/sdk/client/sse.js';
import '@modelcontextprotocol/sdk/shared/protocol.js';
import '@modelcontextprotocol/sdk/types.js';
import 'ai';
import './do-oauth-client-provider.js';
import '@modelcontextprotocol/sdk/client/auth.js';
import '@modelcontextprotocol/sdk/shared/auth.js';

interface CORSOptions {
    origin?: string;
    methods?: string;
    headers?: string;
    maxAge?: number;
    exposeHeaders?: string;
}
type MaybePromise<T> = T | Promise<T>;
declare abstract class McpAgent<Env = unknown, State = unknown, Props extends Record<string, unknown> = Record<string, unknown>> extends DurableObject<Env> {
    private _status;
    private _transport?;
    private _transportType;
    private _requestIdToConnectionId;
    /**
     * Since McpAgent's _aren't_ yet real "Agents", let's only expose a couple of the methods
     * to the outer class: initialState/state/setState/onStateUpdate/sql
     */
    private _agent;
    get mcp(): MCPClientManager;
    protected constructor(ctx: DurableObjectState, env: Env);
    /**
     * Agents API allowlist
     */
    initialState: State;
    get state(): State;
    sql<T = Record<string, string | number | boolean | null>>(strings: TemplateStringsArray, ...values: (string | number | boolean | null)[]): T[];
    setState(state: State): void;
    onStateUpdate(state: State | undefined, source: Connection | "server"): void;
    onStart(): Promise<void>;
    /**
     * McpAgent API
     */
    abstract server: MaybePromise<McpServer | Server>;
    props: Props;
    initRun: boolean;
    abstract init(): Promise<void>;
    _init(props: Props): Promise<void>;
    setInitialized(): Promise<void>;
    isInitialized(): Promise<boolean>;
    private _initialize;
    fetch(request: Request): Promise<Response>;
    getWebSocket(): WebSocket | null;
    getWebSocketForResponseID(id: string): WebSocket | null;
    onMessage(connection: Connection, event: WSMessage): Promise<void>;
    onSSEMcpMessage(_sessionId: string, request: Request): Promise<Error | null>;
    webSocketMessage(ws: WebSocket, event: ArrayBuffer | string): Promise<void>;
    webSocketError(ws: WebSocket, error: unknown): Promise<void>;
    webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void>;
    static mount(path: string, { binding, corsOptions, }?: {
        binding?: string;
        corsOptions?: CORSOptions;
    }): {
        fetch<Env>(this: void, request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
    };
    static serveSSE(path: string, { binding, corsOptions, }?: {
        binding?: string;
        corsOptions?: CORSOptions;
    }): {
        fetch<Env>(this: void, request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
    };
    static serve(path: string, { binding, corsOptions, }?: {
        binding?: string;
        corsOptions?: CORSOptions;
    }): {
        fetch<Env>(this: void, request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
    };
}

export { McpAgent };
