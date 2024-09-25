import type { BaseUser } from "@pluv/io";
import type { PluvIOConfig } from "./PluvIO";
import { PluvIO } from "./PluvIO";

export const createIO = <TUser extends BaseUser>(config: PluvIOConfig<TUser>): PluvIO<TUser> => {
    return new PluvIO(config);
};
