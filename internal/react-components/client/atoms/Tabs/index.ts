import { Tabs as BaseTabs } from "./Tabs";
import { TabsContent } from "./TabsContent";
import { TabsList } from "./TabsList";
import { TabsTrigger } from "./TabsTrigger";

export { TabsContent } from "./TabsContent";
export type { TabsContentProps } from "./TabsContent";
export { TabsList } from "./TabsList";
export type { TabsListProps } from "./TabsList";
export { TabsTrigger } from "./TabsTrigger";
export type { TabsTriggerProps } from "./TabsTrigger";

export const Tabs = Object.assign(BaseTabs, {
    Content: TabsContent,
    List: TabsList,
    Trigger: TabsTrigger,
});
