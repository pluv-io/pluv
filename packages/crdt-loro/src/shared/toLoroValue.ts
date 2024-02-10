import { isWrapper } from "./isWrapper";

export const toLoroValue = (item: any): any => {
    return isWrapper(item) ? item.value : item;
};
