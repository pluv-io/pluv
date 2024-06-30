import { Card as BaseCard } from "./Card";
import { CardContent } from "./CardContent";
import { CardDescription } from "./CardDescription";
import { CardFooter } from "./CardFooter";
import { CardHeader } from "./CardHeader";
import { CardTitle } from "./CardTitle";

export { CardContent } from "./CardContent";
export { CardDescription } from "./CardDescription";
export { CardFooter } from "./CardFooter";
export { CardHeader } from "./CardHeader";
export { CardTitle } from "./CardTitle";

export const Card = Object.assign(BaseCard, {
    Content: CardContent,
    Description: CardDescription,
    Footer: CardFooter,
    Header: CardHeader,
    Title: CardTitle,
});
