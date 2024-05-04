import { LazyMotion as LazyMotionProvider } from "framer-motion";
import type { FC, ReactNode } from "react";

const loadFeatures = () => import("./features").then((res) => res.default);

export interface LazyMotionProps {
    children?: ReactNode;
}

export const LazyMotion: FC<LazyMotionProps> = ({ children }) => {
    return (
        <LazyMotionProvider features={loadFeatures} strict>
            {children}
        </LazyMotionProvider>
    );
};
