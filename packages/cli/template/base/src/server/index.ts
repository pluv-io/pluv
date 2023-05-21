import { createPluvHandler } from "@pluv/platform-node";
import cors from "cors";
import express from "express";
import Http from "http";
import { io } from "./pluv-io";

export { type io } from "./pluv-io";

const PORT = 3001;

const app = express();
const server = Http.createServer(app);

const Pluv = createPluvHandler({
    io,
    server
});

Pluv.createWsServer();

app.use(cors({ origin: "*" }));
app.use(Pluv.handler);

server.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
});
