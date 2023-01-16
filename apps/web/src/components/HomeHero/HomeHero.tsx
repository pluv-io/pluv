import { Rainfall } from "@pluv-internal/rainfall";
import { CSSProperties, FC, useEffect, useMemo, useState } from "react";

export interface HomeHeroProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeHero: FC<HomeHeroProps> = ({ className, style }) => {
    const [rootElem, rootRef] = useState<HTMLDivElement | null>(null);
    const [ready, setReady] = useState<boolean>(false);

    const rainfall = useMemo(
        () => new Rainfall({ onReady: () => setReady(true) }),
        []
    );

    useEffect(() => {
        if (!ready) return;
        if (!rootElem) return;

        rainfall.initialize(rootElem);

        return () => {
            rainfall.uninitialize();
        };
    }, [rainfall, ready, rootElem]);

    return <div ref={rootRef} className={className} style={style} />;
};
