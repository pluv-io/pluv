import { cn } from "@pluv-internal/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { oneLine } from "common-tags";
import type { CSSProperties, FC, ReactNode } from "react";
import { VisuallyHidden } from "../VisuallyHidden";
import { SideDrawerClose } from "./SideDrawerClose";
import { SideDrawerRoot } from "./SideDrawerRoot";
import { SideDrawerTrigger } from "./SideDrawerTrigger";

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
            <Dialog.Overlay
                className={oneLine`
                    z-backdrop
                    fixed
                    inset-0
                    animate-[backdropShow_0.15s_ease-in]
                    bg-black
                    backdrop-blur-lg
                `}
            />
            <Dialog.Content
                className={cn(
                    oneLine`
                        z-side-drawer
                        fixed
                        inset-y-0
                        left-0
                        w-80
                        max-w-[90vw]
                        border-r
                        border-solid
                        border-indigo-700/60
                        bg-zinc-800
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
