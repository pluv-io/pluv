import { cn } from "@pluv-internal/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { oneLine } from "common-tags";
import type { CSSProperties, FC, ReactNode } from "react";
import { VisuallyHidden } from "../VisuallyHidden";
import { SideDrawerClose } from "./SideDrawerClose";
import { SideDrawerRoot } from "./SideDrawerRoot";
import { SideDrawerTrigger } from "./SideDrawerTrigger";
import { Backdrop } from "../../../either";

export type { SideDrawerRootProps } from "./SideDrawerRoot";
export type { SideDrawerTriggerProps } from "./SideDrawerTrigger";

export interface SideDrawerProps {
    children?: ReactNode;
    className?: string;
    description?: string;
    style?: CSSProperties;
    title?: string;
}

const _SideDrawer: FC<SideDrawerProps> = ({ children, className, description, style, title }) => {
    return (
        <Dialog.Portal>
            <Dialog.Overlay asChild>
                <Backdrop />
            </Dialog.Overlay>
            <Dialog.Content
                className={cn(
                    oneLine`
                        fixed
                        inset-y-0
                        left-0
                        z-side-drawer
                        w-80
                        max-w-[90vw]
                        border-r
                        border-solid
                        border-border
                        bg-card
                        shadow-2xl
                        shadow-indigo-800
                        outline-0
                        data-[state="closed"]:animate-[rootHide_0.15s_ease-in]
                        data-[state="open"]:animate-[rootShow_0.15s_ease-in]
                    `,
                    className,
                )}
                style={style}
            >
                <VisuallyHidden>
                    {!!title && <Dialog.Title>{title}</Dialog.Title>}
                    {!!description && <Dialog.Description>{description}</Dialog.Description>}
                </VisuallyHidden>
                {children}
            </Dialog.Content>
        </Dialog.Portal>
    );
};

_SideDrawer.displayName = "SideDrawer";

export const SideDrawer = Object.assign(_SideDrawer, {
    Close: SideDrawerClose,
    Root: SideDrawerRoot,
    Trigger: SideDrawerTrigger,
});
