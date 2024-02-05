import {
    CrdtYjsXmlFragment,
    CrdtYjsXmlFragmentParams,
} from "./CrdtYjsXmlFragment";

export const xmlFragment = (
    params: CrdtYjsXmlFragmentParams,
): CrdtYjsXmlFragment => {
    return new CrdtYjsXmlFragment(params);
};
