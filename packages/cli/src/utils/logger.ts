import colors from "kleur";

export const logger = {
    error(args: string | number) {
        console.log(colors.red(args));
    },
    warn(args: string | number) {
        console.log(colors.yellow(args));
    },
    info(args: string | number) {
        console.log(colors.cyan(args));
    },
    success(args: string | number) {
        console.log(colors.green(args));
    },
};
