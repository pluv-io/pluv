import type { NatMap } from "ioredis";
import { Cluster } from "ioredis";

const host = "0.0.0.0";
const ports = [7000, 7001, 7002, 7003, 7004, 7005];

const nodes = ports.map((port) => ({ host, port }));

const natMap = ports.reduce<NatMap>(
    (acc, port) => ({
        ...acc,
        [`${host}:${port}`]: { host, port },
    }),
    {}
);

export const cluster = new Cluster(nodes, { natMap });
