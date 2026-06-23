import type { IncomingMessage } from "node:http";

export type NodeRegisterInput = { request: Request | IncomingMessage };

export type NodeAuthorizeContext = { request: Request };
