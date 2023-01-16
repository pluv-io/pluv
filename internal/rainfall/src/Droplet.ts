import type { Texture } from "pixi.js";
import { Point, Sprite } from "pixi.js";

export class Droplet extends Sprite {
    public mass: number = 0;
    public toBeRemoved: boolean = false;
    public dropletVelocity: Point = new Point(0, 0);
    public targetMass: number = 0;

    constructor(texture: Texture) {
        super(texture);
    }
}
