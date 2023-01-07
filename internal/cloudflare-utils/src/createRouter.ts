import { Router } from "./Router";

export const createRouter = <TContext = {}>(): Router<TContext, []> => {
    return new Router<TContext>();
};
