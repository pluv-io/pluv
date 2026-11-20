import { ZodCliCode, ZodCliToken, ZodSessionJwt, ZodWhoami } from "../../schemas";
import { apiRequestError } from "../apiRequestError";
import { procedure } from "../procedure";

export const authProcedures = {
    exchangeCliToken: procedure()
        .post("/api/auth/cli/token")
        .unauthenticated()
        .input(ZodCliCode)
        .output(ZodCliToken)
        .error(apiRequestError("Login could not be completed. Run pluv login again."))
        .build(),
    sessionJwt: procedure()
        .post("/api/auth/session/jwt")
        .bearer()
        .output(ZodSessionJwt)
        .resolve((wire) => wire.jwt)
        .error(apiRequestError("The saved login expired. Run pluv login."))
        .build(),
    verify: procedure()
        .get("/api/auth/verify")
        .session()
        .output(ZodWhoami)
        .resolve((wire) => {
            if (!wire.user) throw new Error("The saved login expired. Run pluv login.");

            return wire.user;
        })
        .error(apiRequestError("The saved login expired. Run pluv login."))
        .build(),
    cliLogout: procedure()
        .post("/api/auth/cli/logout")
        .session()
        .noContent()
        .error(
            apiRequestError("The local login was removed, but the session could not be deleted."),
        )
        .build(),
};
