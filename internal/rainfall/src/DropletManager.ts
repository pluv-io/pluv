import type { Container } from "pixi.js";
import { Droplet } from "./Droplet";
import type { DropletAssets } from "./DropletAssets";
import { DropletPool } from "./DropletPool";
import { LargeDroplet } from "./LargeDroplet";
import { getRandomInt } from "./utils";

interface DropletPosition {
    x: number;
    y: number;
}

interface NumericalRange {
    min: number;
    max: number;
}

interface DropletManagerOptions {
    spawnRate: {
        small: number;
        large: number;
    };
    spawnsPerFrame: {
        small: number;
        large: number;
    };
    spawnMass: {
        small: NumericalRange;
        large: NumericalRange;
    };
    poolDroplets: {
        small: NumericalRange;
        large: NumericalRange;
    };
    maximumMassGravity: number;
    maximumMass: number;
    dropletGrowSpeed: number;
    dropletShrinkSpeed: number;
    dropletContainerSize: number;
}

export class DropletManager {
    private largeDropletContainer: DropletPool;
    private largeDroplets: Droplet[];
    private options: DropletManagerOptions;
    private positionMatrix: readonly [number, number][];
    private smallDropletContainer: DropletPool;
    private smallDroplets: Droplet[][][];

    constructor(stage: Container, resources: DropletAssets) {
        const isMobile = stage.width < 700;

        const smallDropletAmount = isMobile ? 750 : 1_750;
        const largeDropletAmount = isMobile ? 50 : 100;

        this.options = {
            spawnRate: {
                small: 0.6,
                large: 0.05,
            },
            spawnsPerFrame: {
                small: 200,
                large: 5,
            },
            spawnMass: {
                small: {
                    min: 1,
                    max: 2,
                },
                large: {
                    min: 7,
                    max: 10,
                },
            },
            poolDroplets: {
                small: {
                    min: smallDropletAmount - 500,
                    max: smallDropletAmount,
                },
                large: {
                    min: largeDropletAmount - 100,
                    max: largeDropletAmount,
                },
            },
            maximumMassGravity: 17,
            maximumMass: 21,
            dropletGrowSpeed: 1,
            dropletShrinkSpeed: 2,
            dropletContainerSize: 100,
        };

        // Define a position matrix so we can calculate all the edges of a droplet in a single loop
        this.positionMatrix = [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
        ];

        this.smallDroplets = [];
        this.largeDroplets = [];

        // Create a container for all the droplets
        this.smallDropletContainer = new DropletPool(
            {
                kind: "default",
                size: [
                    this.options.poolDroplets.small.min,
                    this.options.poolDroplets.small.max,
                ],
            },
            resources
        );

        this.largeDropletContainer = new DropletPool(
            {
                kind: "large",
                size: [
                    this.options.poolDroplets.large.min,
                    this.options.poolDroplets.large.max,
                ],
            },
            resources
        );

        stage.addChild(this.largeDropletContainer);
        stage.addChild(this.smallDropletContainer);
    }

    /**
     * Updates the application and every child of the application
     */
    update(width: number, height: number): void {
        DropletManager.removeLargeOffscreenDroplets(
            width,
            height,
            this.largeDroplets,
            this.largeDropletContainer
        );

        // Trigger the spawn function for a small droplet as much times as is configured in the options
        for (let i = 0; i < this.options.spawnsPerFrame.small; i++) {
            this.spawnNewSmallDroplet(width, height);
        }

        // Trigger the spawn function for a large droplet as much times as is configured in the options
        for (let i = 0; i < this.options.spawnsPerFrame.large; i++) {
            this.spawnNewLargeDroplet(width, height);
        }

        // Check if we need to do anything with a large Droplet
        // We don't process small droplets because they are 'dumb' objects that don't move after they've spawned
        this.checkLargeDropletLogic();
    }

    /**
     * Checks whether a big droplet hits a smaller droplet, if so, it grows by half of the smaller droplets size
     */
    checkLargeDropletLogic(): void {
        // Store the length of the array so the for loop doesn't have to do that every run
        const largeDropletsLength = this.largeDroplets.length;

        for (let i = largeDropletsLength - 1; i >= 0; i--) {
            this.updateLargeDropletSize(this.largeDroplets[i]);
            this.checkDropletMovement(this.largeDroplets[i]);
            this.checkLargeToSmallDropletCollision(this.largeDroplets[i]);
            this.checkLargeToLargeDropletCollision(this.largeDroplets[i]);
            this.removeLargeDroplets(i);
        }
    }

    /**
     * Function that checks if a single large Droplet should be removed
     */
    removeLargeDroplets(i: number): void {
        if (
            this.largeDroplets[i].mass === 0 &&
            this.largeDroplets[i].toBeRemoved === true
        ) {
            this.largeDropletContainer.remove(this.largeDroplets[i]);
            this.largeDroplets.splice(i, 1);
        }
    }

    /**
     * Function that updates the size of a single large Droplet
     */
    updateLargeDropletSize(droplet: Droplet) {
        // If a droplet needs to be removed, we have to shrink it down to 0
        if (droplet.toBeRemoved === true) {
            this.shrinkDropletSize(droplet);
        } else {
            this.growDropletSize(droplet);
        }

        // Update the width and height of the droplet based on the new mass of the droplet
        droplet.width = droplet.mass * 6;
        droplet.height = droplet.mass * 7;
    }

    /**
     * Shrink a droplet based on the configured shrink speed. If it will be too small, we set the mass to 0
     */
    shrinkDropletSize(droplet: LargeDroplet) {
        if (droplet.mass - this.options.dropletShrinkSpeed <= 0) {
            droplet.mass = 0;
        } else {
            droplet.mass -= this.options.dropletShrinkSpeed;
        }
    }

    /**
     * Grow a droplet based on the targetMass he has
     */
    growDropletSize(droplet: LargeDroplet): void {
        // If a droplet has already reached its target mass, exit here
        if (droplet.mass === droplet.targetMass) {
            return;
        }

        // Check if we can grow the droplet based on the configured grow speed
        if (
            droplet.mass + this.options.dropletGrowSpeed >=
            droplet.targetMass
        ) {
            droplet.mass = droplet.targetMass;
        } else {
            droplet.mass += this.options.dropletGrowSpeed;
        }
    }

    /**
     * Check whether a large droplet should be moving or not
     */
    checkDropletMovement(droplet: LargeDroplet): void {
        // If the droplet is going to be removed at the end of this loop, don't bother checking it
        if (droplet.toBeRemoved === true) {
            return;
        }

        // Check if the droplets mass is high enough to be moving, and if the droplet is not moving yet
        if (
            droplet.mass < this.options.maximumMassGravity &&
            droplet.dropletVelocity.y === 0 &&
            droplet.dropletVelocity.x === 0
        ) {
            // There's a slight chance that the droplet starts moving
            if (Math.random() < 0.01) {
                droplet.dropletVelocity.y = getRandomInt(0.5, 3);
            }
        } else if (
            droplet.mass < this.options.maximumMassGravity &&
            droplet.dropletVelocity.y !== 0
        ) {
            // There's a slight chance that the droplet shifts to the left or the right, just like real droplets attach to droplets near them
            if (Math.random() < 0.1) {
                droplet.x += getRandomInt(-10, 10) / 10;
            }

            // There's a slight chance that the droplet stops moving
            if (Math.random() < 0.1) {
                droplet.dropletVelocity.y = 0;
            }
        } else if (
            droplet.mass >= this.options.maximumMassGravity &&
            droplet.dropletVelocity.y < 10
        ) {
            // The droplet is falling because it is too heavy, its speed and direction are now set
            droplet.dropletVelocity.y = getRandomInt(10, 20);
            droplet.dropletVelocity.x = getRandomInt(-10, 10) / 10;
        }

        // Increase the x and y positions of the droplet based on its velocity
        droplet.y += droplet.dropletVelocity.y;
        droplet.x += droplet.dropletVelocity.x;
    }

    /**
     * Checks in which small droplet arrays the large droplet is positioned
     */
    getDropletPresenceArray(droplet: Droplet): DropletPosition[] {
        // Define a set of array indexes through which we hava to search for collision
        const arrayIndexes: DropletPosition[] = [];
        const length = this.positionMatrix.length;

        // Loop through each positionMatrix to calculate the position of every edge of a droplet
        for (let i = 0; i < length; i++) {
            const edgePosition = {
                x: Math.floor(
                    (droplet.x +
                        (droplet.width / 7) * this.positionMatrix[i][0]) /
                        this.options.dropletContainerSize
                ),
                y: Math.floor(
                    (droplet.y +
                        (droplet.height / 7) * this.positionMatrix[i][1]) /
                        this.options.dropletContainerSize
                ),
            };

            // Always push the first position in the arrayIndexes array, we use that value to compare the other edges to
            if (i === 0) {
                arrayIndexes.push(edgePosition);
                continue;
            }

            // If the current position differs from the first position, store the new value because that means that this is also an array we need to check for collision
            if (
                arrayIndexes[0].x !== edgePosition.x ||
                arrayIndexes[0].y !== edgePosition.y
            ) {
                arrayIndexes.push(edgePosition);
            }
        }

        return arrayIndexes;
    }

    /**
     * Check the collision between one large Droplet and all the other Droplets
     */
    checkLargeToLargeDropletCollision(droplet: Droplet): void {
        if (droplet.toBeRemoved === true) {
            return;
        }

        // Store the length of the droplets array so we have that valua cached in the for loop
        const length = this.largeDroplets.length;

        for (let i = length - 1; i >= 0; i--) {
            // Don't bother checking this droplet against itself
            if (
                droplet.x === this.largeDroplets[i].x &&
                droplet.y === this.largeDroplets[i].y
            ) {
                continue;
            }

            // Calculate the difference in position for the horizontal and the vertical axis
            const dx = droplet.x - this.largeDroplets[i].x;
            const dy = droplet.y - this.largeDroplets[i].y;

            // Calculate the distance between the current droplet and the current other droplet
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If the distance between the droplets is close enough, the droplet colliding increases in size
            if (
                distance <=
                droplet.width / 7 + this.largeDroplets[i].width / 7
            ) {
                if (
                    droplet.mass + this.largeDroplets[i].mass <=
                    this.options.maximumMass
                ) {
                    droplet.targetMass =
                        droplet.mass + this.largeDroplets[i].mass;
                } else {
                    droplet.targetMass = this.options.maximumMass;
                }

                // The other droplet should be removed at the end of this loop
                this.largeDroplets[i].toBeRemoved = true;
            }
        }
    }

    /**
     * Checks whether a big droplet hits a smaller droplet, if so, it grows by half of the smaller droplets size
     */
    checkLargeToSmallDropletCollision(droplet: LargeDroplet): void {
        if (droplet.toBeRemoved === true) {
            return;
        }

        // Define a set of array indexes through which we have to search for collision
        const arrayIndexes = this.getDropletPresenceArray(droplet);

        for (let i = 0; i < arrayIndexes.length; i++) {
            // If the small droplet doesn't exist anymore, we can continue to the next value in the loop
            if (
                typeof this.smallDroplets[arrayIndexes[i].x] === "undefined" ||
                typeof this.smallDroplets[arrayIndexes[i].x][
                    arrayIndexes[i].y
                ] === "undefined"
            ) {
                continue;
            }

            // Store the length of the array so the for loop doesn't have to do that every run
            const smallDropletsLength =
                this.smallDroplets[arrayIndexes[i].x][arrayIndexes[i].y].length;

            for (let c = smallDropletsLength - 1; c >= 0; c--) {
                // Calculate the difference in position for the horizontal and the vertical axis
                const dx =
                    droplet.x -
                    this.smallDroplets[arrayIndexes[i].x][arrayIndexes[i].y][c]
                        .x;
                const dy =
                    droplet.y -
                    this.smallDroplets[arrayIndexes[i].x][arrayIndexes[i].y][c]
                        .y;

                // Calculate the distance between the current droplet and the current other droplet
                const distance = Math.sqrt(dx * dx + dy * dy);

                // If the distance is small enough we can increase the size of the large droplet and remove the small droplet
                if (
                    distance <=
                    droplet.width / 7 +
                        this.smallDroplets[arrayIndexes[i].x][
                            arrayIndexes[i].y
                        ][c].width /
                            7
                ) {
                    if (
                        droplet.mass +
                            this.smallDroplets[arrayIndexes[i].x][
                                arrayIndexes[i].y
                            ][c].mass /
                                3 <=
                        this.options.maximumMass
                    ) {
                        droplet.targetMass =
                            droplet.mass +
                            this.smallDroplets[arrayIndexes[i].x][
                                arrayIndexes[i].y
                            ][c].mass /
                                3;
                    }

                    // Remove the small droplet and put it back in the object pool
                    this.smallDropletContainer.remove(
                        this.smallDroplets[arrayIndexes[i].x][
                            arrayIndexes[i].y
                        ][c]
                    );
                    this.smallDroplets[arrayIndexes[i].x][
                        arrayIndexes[i].y
                    ].splice(c, 1);
                }
            }
        }
    }

    /**
     * Checks each droplet to see if it is positioned offscreen. If so, it's being pushed back into the object pool to be reused
     */
    static removeLargeOffscreenDroplets(
        width: number,
        height: number,
        dropletArray: Droplet[],
        dropletContainer: DropletPool
    ): void {
        // Store the length of the array so the for loop doesn't have to do that every run
        const length = dropletArray.length;

        for (let i = length - 1; i >= 0; i--) {
            if (
                dropletArray[i].x > width + 10 ||
                dropletArray[i].x < -10 ||
                dropletArray[i].y > height + 10 ||
                dropletArray[i].y < -100
            ) {
                dropletContainer.remove(dropletArray[i]);
                dropletArray.splice(i, 1);
            }
        }
    }

    /**
     * Spawns a new large droplet on the screen based on the spawn chance
     */
    spawnNewLargeDroplet(width: number, height: number): void {
        // If our random value doesn't match the given spawn rate, we don't spawn a droplet
        if (Math.random() > this.options.spawnRate.large) {
            return;
        }

        // Get a new droplet object from the pool
        const droplet = this.largeDropletContainer.get();

        // If the pool decided that we can't add more droplets, exit here
        if (droplet === null) {
            return;
        }

        // Make sure the droplet updates with a new position and radius
        const mass = getRandomInt(
            this.options.spawnMass.large.min,
            this.options.spawnMass.large.max
        );
        droplet.x = getRandomInt(0, width);
        droplet.y = getRandomInt(-100, height / 1.5);
        droplet.mass = mass / 2;
        droplet.targetMass = mass;
        droplet.width = droplet.mass * 6;
        droplet.height = droplet.mass * 7;
        droplet.dropletVelocity.x = 0;
        droplet.toBeRemoved = false;

        this.largeDroplets.push(droplet);
    }

    /**
     * Spawns a new small droplet on the screen based on the spawn chance
     */
    spawnNewSmallDroplet(width: number, height: number): void {
        // If our random value doesn't match the given spawn rate, we don't spawn a droplet
        if (Math.random() > this.options.spawnRate.small) {
            return;
        }

        // Get a new droplet object from the pool
        const droplet = this.smallDropletContainer.get();

        // If the pool decided that we can't add more droplets, exit here
        if (droplet === null) {
            return;
        }

        const position = {
            x: getRandomInt(0, width),
            y: getRandomInt(0, height),
        };
        const mass = getRandomInt(
            this.options.spawnMass.small.min,
            this.options.spawnMass.small.max
        );
        const arrayIndex = {
            x: Math.floor(position.x / this.options.dropletContainerSize),
            y: Math.floor(position.y / this.options.dropletContainerSize),
        };

        // Make sure the droplet updates with a new position and radius
        droplet.x = position.x;
        droplet.y = position.y;
        droplet.mass = mass;
        droplet.width = droplet.mass * 8;
        droplet.height = droplet.mass * 8;

        if (typeof this.smallDroplets[arrayIndex.x] === "undefined") {
            this.smallDroplets[arrayIndex.x] = [];
        }

        if (
            typeof this.smallDroplets[arrayIndex.x][arrayIndex.y] ===
            "undefined"
        ) {
            this.smallDroplets[arrayIndex.x][arrayIndex.y] = [];
        }

        this.smallDroplets[arrayIndex.x][arrayIndex.y].push(droplet);
    }
}
