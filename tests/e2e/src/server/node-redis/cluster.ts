import { Cluster } from "ioredis";

const nodes = [7000, 7001, 7002, 7003, 7004, 7005].map((port) => ({
    host: "127.0.0.1",
    port,
}));

export const cluster = new Cluster(nodes);
