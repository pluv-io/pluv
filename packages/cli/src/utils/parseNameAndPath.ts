import path from "path";

/**
 *  Parses the appName and its path from the user input.
 * Returns an array of [appName, path] where appName is the name put in the package.json and
 *   path is the path to the directory where the app will be created.
 * If the appName is '.', the name of the directory will be used instead.
 * Handles the case where the input includes a scoped package name
 * in which case that is being parsed as the name, but not included as the path
 * e.g. dir/@mono/app => ["@mono/app", "dir/app"]
 * e.g. dir/app => ["app", "dir/app"]
 **/
export const parseNameAndPath = (
    input: string,
): readonly [name: string, path: string] => {
    const paths = input.split("/");

    let appName = paths[paths.length - 1];

    // If the user ran `npx create-t3-app .` or similar, the appName should be the current directory
    if (appName === ".") {
        const parsedCwd = path.resolve(process.cwd());

        appName = path.basename(parsedCwd);
    }

    // If the first part is a @, it's a scoped package
    const indexOfDelimiter = paths.findIndex((p) => p.startsWith("@"));
    if (paths.findIndex((p) => p.startsWith("@")) !== -1) {
        appName = paths.slice(indexOfDelimiter).join("/");
    }

    const _path = paths.filter((p) => !p.startsWith("@")).join("/");

    return [appName, _path];
};
