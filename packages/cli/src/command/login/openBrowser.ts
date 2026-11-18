import { spawn } from "node:child_process";

export const openBrowser = (url: string): void => {
    const child =
        process.platform === "win32"
            ? spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" })
            : spawn(process.platform === "darwin" ? "open" : "xdg-open", [url], {
                  detached: true,
                  stdio: "ignore",
              });

    child.on("error", () => undefined);
    child.unref();
};
