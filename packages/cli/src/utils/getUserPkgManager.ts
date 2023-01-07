export type PackageManager = "npm" | "pnpm" | "yarn";

export const getUserPkgManager = (): PackageManager => {
    // This environment variable is set by npm and yarn but pnpm seems less consistent
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const userAgent = process.env.npm_config_user_agent;

    // If no user agent is set, assume npm
    if (!userAgent) return "npm";

    if (userAgent.startsWith("yarn")) return "yarn";
    if (userAgent.startsWith("pnpm")) return "pnpm";

    return "npm";
};
