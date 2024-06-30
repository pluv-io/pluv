import { Close } from "@radix-ui/react-dialog";
import type { FC, ReactElement } from "react";

export interface SideDrawerCloseProps {
    children: ReactElement;
}

export const SideDrawerClose: FC<SideDrawerCloseProps> = ({ children }) => {
    return <Close asChild>{children}</Close>;
};
