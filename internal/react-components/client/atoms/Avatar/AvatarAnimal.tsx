import type { Json } from "@pluv-internal/typings";
import { capitalize } from "@pluv-internal/utils";
import * as RadixAvatar from "@radix-ui/react-avatar";
import NextImage from "next/image";
import type { ElementRef } from "react";
import { forwardRef, useMemo, useState } from "react";

const ANIMALS = [
    "alligator",
    "anteater",
    "armadillo",
    "auroch",
    "badger",
    "bat",
    "beaver",
    "buffalo",
    "camel",
    "capybara",
    "chameleon",
    "cheetah",
    "chinchilla",
    "chipmunk",
    "chupacabra",
    "cormorant",
    "coyote",
    "crow",
    "dingo",
    "dolphin",
    "duck",
    "elephant",
    "ferret",
    "fox",
    "giraffe",
    "gopher",
    "grizzly",
    "hippo",
    "hyena",
    "ibex",
    "iguana",
    "jackal",
    "kangaroo",
    "koala",
    "kraken",
    "lemur",
    "leopard",
    "liger",
    "llama",
    "manatee",
    "mink",
    "monkey",
    "moose",
    "narwhal",
    "orangutan",
    "otter",
    "panda",
    "penguin",
    "platypus",
    "python",
    "quagga",
    "rabbit",
    "raccoon",
    "rhino",
    "sheep",
    "shrew",
    "skunk",
    "squirrel",
    "tiger",
    "turtle",
    "walrus",
    "wolf",
    "wolverine",
    "wombat",
];

const COLORS = [
    "#721acb",
    "#841acb",
    "#931acb",
    "#a51acb",
    "#b41acb",
    "#c51acb",
    "#cb1abf",
    "#cb1ab1",
    "#cb1a9f",
    "#cb1a8d",
    "#cb1a7e",
    "#cb1a6c",
    "#cb1a5e",
    "#cb1a4c",
    "#cb1a3a",
    "#cb1a2b",
    "#cb1a1a",
    "#cb2b1a",
    "#cb3a1a",
    "#cb4c1a",
    "#cb5e1a",
    "#cb6c1a",
    "#cb7e1a",
    "#cb8d1a",
    "#cb9f1a",
    "#cbb11a",
    "#cbbf1a",
    "#c5cb1a",
    "#b4cb1a",
    "#a5cb1a",
    "#93cb1a",
    "#84cb1a",
    "#72cb1a",
    "#61cb1a",
    "#52cb1a",
    "#40cb1a",
    "#31cb1a",
    "#1fcb1a",
    "#1acb25",
    "#1acb34",
    "#1acb46",
    "#1acb58",
    "#1acb67",
    "#1acb78",
    "#1acb87",
    "#1acb99",
    "#1acbab",
    "#1acbb9",
    "#1acbcb",
    "#1ab9cb",
    "#1aabcb",
    "#1a99cb",
    "#1a87cb",
    "#1a78cb",
    "#1a67cb",
    "#1a58cb",
    "#1a46cb",
    "#1a34cb",
    "#1a25cb",
    "#1f1acb",
    "#311acb",
    "#401acb",
    "#521acb",
    "#611acb",
];

const DEFAULT_SIZE = 128;

export interface AvatarAnimalProps {
    className?: string;
    data?: Json;
    height?: number;
    width?: number;
}

export const AvatarAnimal = forwardRef<ElementRef<typeof RadixAvatar.Image>, AvatarAnimalProps>(
    ({ className, data, height = DEFAULT_SIZE, width = DEFAULT_SIZE }, ref) => {
        const [randomHash] = useState(() => Math.floor(Math.random() * Math.min(ANIMALS.length, COLORS.length)));

        const hash = useMemo(() => {
            if (typeof data === "undefined") return randomHash;

            const toStableString = (currentData: Json, currentString: string = ""): string => {
                if (currentData === null) return `${currentString}:null`;
                if (
                    typeof currentData === "string" ||
                    typeof currentData === "boolean" ||
                    typeof currentData === "number"
                ) {
                    return `${currentString}:${currentData}`;
                }

                if (Array.isArray(currentData)) {
                    return `${currentString}:[${currentData.map((item) => toStableString(item)).join(",")}]`;
                }

                if (typeof currentData === "object") {
                    return `${currentString}:{${Object.entries(currentData)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, value]) => `${key}:${toStableString(value)}`)
                        .join(",")}}`;
                }

                return currentString;
            };

            const stable: string = toStableString(data);

            return Math.abs(stable.split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0));
        }, [data, randomHash]);

        const animalIndex = hash % ANIMALS.length;
        const colorIndex = hash % COLORS.length;
        const animal = ANIMALS[animalIndex];
        const color = COLORS[colorIndex];

        const alt = useMemo(() => `Anomymous ${capitalize(animal)}`, [animal]);
        const src = `https://ssl.gstatic.com/docs/common/profile/${animal}_lg.png`;

        return (
            <RadixAvatar.Image asChild src={src}>
                <NextImage
                    alt={alt}
                    className={className}
                    height={height}
                    loader={({ src }) => src}
                    src={src}
                    unoptimized
                    width={width}
                    ref={ref}
                    style={{ backgroundColor: color }}
                />
            </RadixAvatar.Image>
        );
    },
);

AvatarAnimal.displayName = "AvatarAnimal";
