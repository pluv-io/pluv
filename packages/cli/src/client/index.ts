export type { ServiceUrls } from "../commands/shared/types";
export { api, ApiRequest } from "./api";
export {
    bindRouter,
    type BoundProcedure,
    type BoundRouter,
    type InferProcedureInput,
    type InferProcedureOutput,
    type InferProcedureWireOutput,
    type InferRouterInputs,
    type InferRouterOutputs,
} from "./procedure";
export { cliRpc, type CliRpc } from "./rpc";
