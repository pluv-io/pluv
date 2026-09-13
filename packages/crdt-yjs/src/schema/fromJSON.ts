import {
    CrdtSchemaError,
    fromJSON as fromJsonSchema,
    isYjsCrdtKind,
    type AnySchemaNode,
    type SchemaAst,
} from "@pluv/crdt";
import { yArray, yMap, yText, yXmlElement, yXmlFragment, yXmlText } from "./nodes";

export const fromJSON = (ast: SchemaAst): AnySchemaNode => {
    switch (ast.kind) {
        case "yArray":
            return yArray(fromJSON(ast.item as SchemaAst));
        case "yMap":
            return yMap(fromJSON(ast.value as SchemaAst));
        case "yText":
            return yText();
        case "yXmlText":
            return yXmlText();
        case "yXmlElement":
            return yXmlElement();
        case "yXmlFragment":
            return yXmlFragment();
        default:
            if (isYjsCrdtKind(ast.kind)) {
                throw new CrdtSchemaError(`Unhandled Yjs schema kind "${ast.kind}"`);
            }

            return fromJsonSchema(ast);
    }
};
