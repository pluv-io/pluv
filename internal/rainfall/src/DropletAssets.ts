import type { Texture } from "pixi.js";
import { loader as PixiLoader } from "pixi.js";

const ASSET_BASE_PREFIX =
    "https://raw.githubusercontent.com/pluv-io/pluv/master/assets/rainfall-";

const ALPHA = `${ASSET_BASE_PREFIX}alpha.png`;
const SHINE = `${ASSET_BASE_PREFIX}shine.png`;
const BACKGROUND = `${ASSET_BASE_PREFIX}background.jpg`;
const FOREGROUND = `${ASSET_BASE_PREFIX}foreground.jpg`;

export interface DropletAssets {
    ALPHA: Texture;
    SHINE: Texture;
    BACKGROUND: Texture;
    FOREGROUND: Texture;
}

const getAssetKey = (key: string): string => {
    switch (key) {
        case ALPHA:
            return "ALPHA";
        case SHINE:
            return "SHINE";
        case BACKGROUND:
            return "BACKGROUND";
        case FOREGROUND:
            return "FOREGROUND";
        default:
            throw new Error("Invalid key");
    }
};

export const getDropletAssets = async (): Promise<DropletAssets> => {
    const loader = PixiLoader;

    const resources = await new Promise<Partial<Record<string, any>>>(
        (resolve) => {
            loader
                .reset()
                .add(ALPHA)
                .add(SHINE)
                .add(BACKGROUND)
                .add(FOREGROUND)
                .load((_, _resources) => {
                    resolve(_resources);
                });
        }
    );

    const assets = Object.entries(resources).reduce(
        (acc, [key, value]) => ({
            ...acc,
            [getAssetKey(key)]: value?.texture!,
        }),
        {} as DropletAssets
    );

    return assets as DropletAssets;
};
