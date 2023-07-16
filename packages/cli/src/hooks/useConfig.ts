import { useState } from "react";
import { getConfig } from "../utils/config.js";

export const useConfig = () => {
    const [config] = useState(() => getConfig());

    return config;
};
