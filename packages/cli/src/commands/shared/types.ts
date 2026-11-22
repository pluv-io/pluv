import type { PluvConfig } from "../../schemas";

/** Resolved internal service URLs from `config["~"]`. */
export type ServiceUrls = PluvConfig["~"];

export type ScreenProps = {
    config: PluvConfig;
    warning: string | null;
};
