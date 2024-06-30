import { ComponentType, ForwardedRef, ReactElement, forwardRef } from "react";

/**
 * !HACK
 * @description This component is used to forward refs of class components.
 * This is useful for components that cannot be function components, for
 * example, if they need `componentDidCatch` which cannot be implemented in
 * hooks at the time of this comment. This is also useful to inject refs for
 * components wrapped with next/dynamic
 * @author David Lee
 * @date October 24, 2021
 */
export const withForwardRef = <T extends unknown, P extends { innerRef?: ForwardedRef<T> }>(
    Component: ComponentType<P>,
) => {
    const wrappedComponent = ((props: P, ref: ForwardedRef<T>): ReactElement => {
        return <Component {...(props as any)} innerRef={ref} />;
    }) as ((props: P, ref: ForwardedRef<T>) => ReactElement) & {
        displayName?: string;
    };

    wrappedComponent.displayName = `WithForwardedRef(${wrappedComponent.displayName || wrappedComponent.name})`;

    return forwardRef<T, P>(wrappedComponent);
};
