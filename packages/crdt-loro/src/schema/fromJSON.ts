import {
    CrdtSchemaError,
    fromJSON as fromJsonSchema,
    isLoroCrdtKind,
    type AnySchemaNode,
    type SchemaAst,
} from "@pluv/crdt";
import { loroCounter, loroList, loroMap, loroMovableList, loroText, loroTree } from "./nodes";

export const fromJSON = (ast: SchemaAst): AnySchemaNode => {
    switch (ast.kind) {
        case "loroList":
            return loroList(fromJSON(ast.item as SchemaAst));
        case "loroMap":
            return loroMap(fromJSON(ast.value as SchemaAst));
        case "loroText":
            return loroText();
        case "loroMovableList":
            return loroMovableList(fromJSON(ast.item as SchemaAst));
        case "loroCounter":
            return loroCounter();
        case "loroTree":
            return loroTree();
        default:
            if (isLoroCrdtKind(ast.kind)) {
                throw new CrdtSchemaError(`Unhandled Loro schema kind "${ast.kind}"`);
            }

            return fromJsonSchema(ast);
    }
};
