import type { DropletAssets } from "./DropletAssets";
import { getDropletAssets } from "./DropletAssets";
import { EffectCanvas } from "./EffectCanvas";

export interface RainfallOptions {
    height?: number;
    onReady?: () => void;
    width?: number;
}

export class Rainfall {
    private _effectCanvas: EffectCanvas | null = null;
    private _resources: DropletAssets | null = null;
    private _uninitialize: (() => void) | null = null;

    public isReady: boolean = false;

    constructor(options: RainfallOptions = {}) {
        const { onReady } = options;

        getDropletAssets().then((resources) => {
            this._resources = resources;

            onReady?.();
        });
    }

    public initialize(container: HTMLElement): void {
        if (!this._resources) return;

        this._effectCanvas = new EffectCanvas(container, this._resources);

        const resize = this.resize.bind(this);

        const observer = new ResizeObserver(() => {
            resize();
        });

        observer.observe(container);

        this._uninitialize = () => {
            observer.disconnect();
        };

        resize();

        this._loop();
    }

    public resize(): void {
        if (!this._effectCanvas) return;

        this._effectCanvas.resize();
    }

    public uninitialize(): void {
        if (!this._effectCanvas) return;

        this._uninitialize?.();

        this._effectCanvas.destroy();
        this._effectCanvas = null;
    }

    private _loop(): void {
        window.requestAnimationFrame(() => {
            if (!this._effectCanvas) return;

            this._loop();
        });

        if (!this._effectCanvas) return;

        this._effectCanvas.update();
        this._effectCanvas.render();
    }
}
