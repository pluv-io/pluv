import { particles } from "pixi.js";
import { Droplet } from "./Droplet";
import type { DropletAssets } from "./DropletAssets";
import { LargeDroplet } from "./LargeDroplet";

type DropletKind = "default" | "large";

interface DropletPoolOptions {
    kind: DropletKind;
    size: [min: number, max: number];
}

export class DropletPool extends particles.ParticleContainer {
    private inUse: number = 0;
    private kind: DropletKind;
    private pool: Droplet[] = [];
    private resources: DropletAssets;
    private size: [min: number, max: number];

    constructor(options: DropletPoolOptions, resources: DropletAssets) {
        const {
            kind,
            size: [minSize, maxSize],
        } = options;

        super(maxSize, {
            scale: true,
            position: true,
            rotation: false,
            uvs: false,
            alpha: false,
        });

        this.resources = resources;

        this.kind = kind;
        this.size = [minSize, maxSize];

        this.initialize();
    }

    private getDroplet(): Droplet {
        return this.kind === "default"
            ? new Droplet(this.resources.ALPHA)
            : new LargeDroplet(this.resources.ALPHA);
    }

    /**
     * Initialize the initial batch of objects that we are going to use throughout the application
     */
    initialize(): void {
        for (let i = 0; i < this.size[0]; i += 1) {
            const droplet = this.getDroplet();
            droplet.x = -100;
            droplet.y = -100;
            droplet.anchor.set(0.5);

            // Add the object to the PIXI Container and store it in the pool
            this.addChild(droplet);
            this.pool.push(droplet);
        }
    }

    /**
     * Get an object from the object pool, checks whether there is an object left or it if may create a new object otherwise
     * @returns {object}
     */
    get(): Droplet | null {
        // Check if we have reached the maximum number of objects, if so, return null
        if (this.inUse >= this.size[1]) return null;

        // We haven't reached the maximum number of objects yet, so we are going to reuse an object
        this.inUse++;

        // If there are still objects in the pool return the last item from the pool
        if (this.pool.length > 0) return this.pool.pop() ?? null;

        // The pool was empty, but we are still allowed to create a new object and return that
        const droplet = this.getDroplet();

        droplet.x = -100;
        droplet.y = -100;
        droplet.anchor.set(0.5, 0.5);

        // Add the object to the PIXI Container and return it
        this.addChild(droplet);

        return droplet;
    }

    /**
     * Put an element back into the object pool and reset it for later use
     * @param element - The object that should be pushed back into the object pool to be reused later on
     */
    remove(element: Droplet): void {
        if (this.inUse - 1 < 0) {
            console.error(
                "Something went wrong, you cant remove more elements than there are in the total pool"
            );
            return;
        }

        // Move the droplet offscreen, we cant't set visible or rendering to false because that doesn't matter in a PIXI.ParticleContainer
        // @see: https://github.com/pixijs/pixi.js/issues/1910
        element.x = -100;
        element.y = -100;

        // Push the element back into the object pool so it can be reused again
        this.inUse -= 1;
        this.pool.push(element);
    }
}
