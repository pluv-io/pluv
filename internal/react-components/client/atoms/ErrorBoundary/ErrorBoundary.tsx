import type { Maybe } from "@pluv-internal/typings";
import { Component, ComponentType, ErrorInfo, FC, MutableRefObject, ReactElement, useContext } from "react";
import { withForwardRef } from "../../../higher-order";
import { ErrorBoundaryContext } from "./context";

export const useErrorBoundary = () => {
    return useContext(ErrorBoundaryContext);
};

export interface ErrorBoundaryFallbackProps {
    error: Maybe<Error>;
    reset: () => void;
}

export interface ErrorBoundaryRef {
    reset: () => void;
}

export interface ErrorChildProps {
    error: Maybe<Error>;
    fallback: Maybe<string | number | ReactElement>;
    reset: () => void;
}

export interface ErrorBoundaryProps {
    children?: FC<ErrorChildProps>;
    fallback?: Maybe<ComponentType<ErrorBoundaryFallbackProps>>;
    onError?: (error: Error) => void;
    onReset?: () => void;
    innerRef?: MutableRefObject<ErrorBoundaryRef>;
}

interface ErrorBoundaryState {
    error?: Maybe<Error>;
}

class _ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);

        const { innerRef } = this.props;

        if (innerRef) {
            innerRef.current = { reset: this.reset };
        }

        this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (process.env.NODE_ENV !== "production") {
            /* eslint-disable no-console */
            console.error(error, errorInfo);
            /* eslint-enable no-console */
        }

        const { onError } = this.props;

        onError?.(error);
    }

    private reset = () => {
        const { onReset } = this.props;

        onReset?.();
        this.setState({ error: null });
    };

    private renderChild() {
        const { children, fallback: FallbackComponent } = this.props;
        const { error } = this.state;

        const fallback =
            error && FallbackComponent !== undefined ? (
                FallbackComponent ? (
                    <FallbackComponent error={error} reset={this.reset} />
                ) : null
            ) : null;

        return children?.({
            error,
            fallback,
            reset: this.reset,
        });
    }

    render() {
        return (
            <ErrorBoundaryContext.Provider value={{ reset: this.reset }}>
                {this.renderChild()}
            </ErrorBoundaryContext.Provider>
        );
    }
}

export const ErrorBoundary = withForwardRef<ErrorBoundaryRef, ErrorBoundaryProps>(_ErrorBoundary);
