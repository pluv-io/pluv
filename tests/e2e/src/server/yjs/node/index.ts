import { createPluvHandler } from "@pluv/platform-node";
import bodyParser from "body-parser";
import { Option, program } from "commander";
import cors from "cors";
import Crypto from "crypto";
import express from "express";
import Http from "http";
import { io } from "./pluv-io";

export type { io } from "./pluv-io";

type CommanderOptionValue = string | boolean | string[] | undefined;

const options = program
    .description("Pluv server running on node")
    .addOption(
        new Option("--port <PORT>")
            .default(3102)
            .argParser((value: string) => parseInt(value, 10)),
    )
    .parse(process.argv)
    .opts<{ port: CommanderOptionValue }>();

const port = parseInt(`${options.port}`, 10);

if (Number.isNaN(port)) {
    throw new Error("Port is not a number");
}

const app = express();
const server = Http.createServer(app);

const Pluv = createPluvHandler({
    authorize: () => {
        const id = Crypto.randomUUID();

        return { id, name: `user:${id}` };
    },
    io,
    server,
});

Pluv.createWsServer();

app.use(bodyParser.json());
app.use(cors({ origin: "*" }));
app.use(Pluv.handler);

server.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});
