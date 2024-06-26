import { Trigger } from "@radix-ui/react-dialog";
import type { FC, ReactElement } from "react";

export interface SideDrawerTriggerProps {
    children: ReactElement;
}

export const SideDrawerTrigger: FC<SideDrawerTriggerProps> = ({ children }) => {
    return <Trigger asChild>{children}</Trigger>;
};
