import { bindRouter } from "./procedure";
import { authProcedures } from "./router/auth";
import { internalProcedures } from "./router/internal";

export const cliRpc = {
    auth: bindRouter(authProcedures),
    internal: bindRouter(internalProcedures),
};

export type CliRpc = typeof cliRpc;
