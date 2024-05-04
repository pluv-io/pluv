import { Rainfall } from "@pluv-internal/rainfall";
import { CSSProperties, memo, useEffect, useMemo, useState } from "react";

export interface HomeHeroRainfallProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeHeroRainfall = memo<HomeHeroRainfallProps>(({ className, style }) => {
    const [rainfallElem, rainfallRef] = useState<HTMLDivElement | null>(null);
    const [ready, setReady] = useState<boolean>(false);
    const rainfall = useMemo(() => new Rainfall({ onReady: () => setReady(true) }), []);

    useEffect(() => {
        if (!ready) return;
        if (!rainfallElem) return;

        rainfall.initialize(rainfallElem);

        return () => {
            rainfall.uninitialize();
        };
    }, [rainfall, ready, rainfallElem]);

    return <div ref={rainfallRef} className={className} style={style} />;
});

HomeHeroRainfall.displayName = "HomeHeroRainfall";

export default HomeHeroRainfall;
