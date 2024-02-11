import { isWrapper } from "./isWrapper";

export const toYjsValue = (item: any): any => {
    return isWrapper(item) ? item.value : item;
};
