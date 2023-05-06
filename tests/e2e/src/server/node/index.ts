import { createPluvHandler } from "@pluv/platform-node";
import bodyParser from "body-parser";
import { program } from "commander";
import cors from "cors";
import Crypto from "crypto";
import express from "express";
import Http from "http";
import { io } from "./pluv-io";

export type { io } from "./pluv-io";

type CommanderOptionValue = string | boolean | string[] | undefined;

const options = program
    .description("Pluv server running on node")
    .option("--port", "Port to run the server on", "3102")
    .parse(process.argv)
    .opts<{ port: CommanderOptionValue }>();

const port = parseInt(`${options.port}`, 10);

if (Number.isNaN(port)) {
    throw new Error("Port is not a number");
}

const app = express();
const server = Http.createServer(app);

createPluvHandler({
    authorize: () => {
        const id = Crypto.randomUUID();

        return { id, name: `user:${id}` };
    },
    io,
    server,
});

app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

server.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});
