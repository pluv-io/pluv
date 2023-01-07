import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const distPath = path.dirname(__filename);

export const PKG_ROOT = path.join(distPath, "../");

export const DEFAULT_APP_NAME = "my-pluv-app";
export const PLUV_APP = "pluv-app";

/* eslint-disable prettier/prettier */
export const TITLE_TEXT = String.raw`
 _____  _             _____ ____  
|  __ \| |           |_   _/ __ \ 
| |__) | |_   ___   __ | || |  | |
|  ___/| | | | \ \ / / | || |  | |
| |    | | |_| |\ V / _| || |__| |
|_|    |_|\__,_| \_(_)_____\____/ 
`;
/* eslint-enable prettier/prettier */
