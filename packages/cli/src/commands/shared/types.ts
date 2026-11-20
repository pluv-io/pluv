import type { PluvConfig } from "../../schemas";

/** Resolved internal service URLs from `config["~"]`. */
export type ServiceUrls = PluvConfig["~"];

export type ScreenProps = {
    config: PluvConfig;
    done: (text: string, code: number) => void;
    warning: string | null;
};
