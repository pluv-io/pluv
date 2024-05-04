import isPropValid from "@emotion/is-prop-valid";

export const filterValidProps = <TProps extends Record<string, any>>(props: TProps): TProps => {
    return Object.entries(props).reduce((acc, [key, value]) => {
        return isPropValid(key) ? { ...acc, [key]: value } : acc;
    }, {} as TProps);
};
