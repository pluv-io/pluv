import type { NatMap } from "ioredis";
import { Cluster } from "ioredis";

const ports = [7000, 7001, 7002, 7003, 7004, 7005];

const nodes = ports.map((port) => ({
    host: "127.0.0.1",
    port,
}));

const natMap = ports.reduce<NatMap>(
    (acc, port) => ({
        ...acc,
        [`127.0.0.1:${port}`]: { host: "127.0.0.1", port },
    }),
    {}
);

export const cluster = new Cluster(nodes, { natMap });
