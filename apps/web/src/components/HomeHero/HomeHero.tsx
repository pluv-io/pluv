import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import { CSSProperties, memo } from "react";

const HomeHeroRainfall = dynamic(() => import("./HomeHeroRainfall"), {
    ssr: false,
});

export interface HomeHeroProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeHero = memo<HomeHeroProps>(({ className, style }) => {
    return (
        <div
            className={clsx(
                className,
                "relative aspect-[3/2] w-full overflow-hidden"
            )}
            style={style}
        >
            <NextImage
                alt="rainfall hero"
                className="absolute inset-0 object-cover"
                fill
                priority
                src="/static/jpg/rainfall-background.jpg"
            />
            <HomeHeroRainfall className="absolute inset-0 z-[1]" />
        </div>
    );
});

HomeHero.displayName = "HomeHero";
