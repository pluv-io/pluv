import {
    autoDetectRenderer,
    CanvasRenderer,
    Container,
    Filter,
    Graphics,
    utils,
} from "pixi.js";
import type { DropletAssets } from "./DropletAssets";
import { DropletManager } from "./DropletManager";
import { dropletShader } from "./DropletShader";

export class EffectCanvas {
    private dropletManager: DropletManager;
    private dropletShader: Filter<{
        iResolution: [number, number];
        vTextureSize: [number, number];
        uTextureForeground: PIXI.Texture | null;
        uTextureBackground: PIXI.Texture | null;
        uTextureDropShine: PIXI.Texture | null;
    }>;

    public background: Graphics;
    public container: HTMLElement;
    public renderer: CanvasRenderer | null = null;
    public stage: Container;

    constructor(container: HTMLElement, resources: DropletAssets) {
        this.container = container;

        const height = this.container.clientHeight;
        const width = this.container.clientWidth;

        this.renderer = autoDetectRenderer({
            width,
            height,
            antialias: false,
            transparent: false,
        }) as CanvasRenderer;

        container.appendChild(this.renderer.view);

        this.stage = new Container();

        // Create a graphics object that is as big as the scene of the users window
        // Else the shader won't fill the entire screen
        this.background = new Graphics();

        this.background
            .beginFill(0xffffff, 0)
            .drawRect(0, 0, width, height)
            .endFill();
        this.background.alpha = 0;

        this.stage.addChild(this.background);

        // Create the DropletManager and pass it the stage so it can insert the droplet containers into it
        this.dropletManager = new DropletManager(this.stage, resources);

        dropletShader.uniforms.iResolution.value = [width, height];
        dropletShader.uniforms.uTextureDropShine.value = resources.SHINE;
        dropletShader.uniforms.uTextureBackground.value = resources.BACKGROUND;
        dropletShader.uniforms.uTextureForeground.value = resources.FOREGROUND;
        dropletShader.uniforms.vTextureSize.value = [
            resources.BACKGROUND.width,
            resources.BACKGROUND.height,
        ];

        this.dropletShader = new Filter(
            "",
            dropletShader.fragment,
            dropletShader.uniforms,
        );

        this.stage.filters = [this.dropletShader];
    }

    public destroy(): void {
        if (!this.renderer) return;

        // this.dropletShader.destroy();
        this.stage.destroy({
            baseTexture: true,
            children: true,
            texture: true,
        });
        this.renderer.destroy(true);
    }

    public resize(): void {
        if (!this.renderer) return;

        const height = this.container.clientHeight;
        const width = this.container.clientWidth;

        this.renderer.resize(width, height);

        this.background
            .clear()
            .beginFill(0xffffff)
            .drawRect(0, 0, width, height)
            .endFill();

        this.background.alpha = 0;
    }

    public update(): void {
        const height = this.container.clientHeight;
        const width = this.container.clientWidth;

        this.updateShader(width, height);
        this.dropletManager.update(width, height);
    }

    public updateShader(width: number, height: number): void {
        this.dropletShader.uniforms.iResolution = [width, height];
    }

    public render(): void {
        if (!this.renderer) return;

        this.renderer.render(this.stage);
    }
}
