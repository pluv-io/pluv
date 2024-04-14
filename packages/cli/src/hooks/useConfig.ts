import { useState } from "react";
import { getConfig } from "../utils/index.js";

export const useConfig = () => {
    const [config] = useState(() => getConfig());

    return config;
};
