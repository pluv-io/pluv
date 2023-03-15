import * as Dialog from "@radix-ui/react-dialog";
import { CSSProperties, FC, ReactNode } from "react";
import { keyframes } from "styled-components";
import tw, { styled } from "twin.macro";
import { getZIndex } from "../../z-indices";
import { VisuallyHidden } from "../VisuallyHidden";
import { SideDrawerRoot } from "./SideDrawerRoot";
import { SideDrawerTrigger } from "./SideDrawerTrigger";

export type { SideDrawerRootProps } from "./SideDrawerRoot";
export type { SideDrawerTriggerProps } from "./SideDrawerTrigger";

const backdropShow = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const Backdrop = styled(Dialog.Overlay)`
    ${tw`
        fixed
        inset-0
        bg-black
        backdrop-blur-lg
    `}
    animation: ${backdropShow} 0.15s ease-in;
    z-index: ${getZIndex("backdrop")};
`;

const rootShow = keyframes`
    from {
        transform: translateX(-100%);
    }
    to {
        transform: translateX(0);
    }
`;

const rootHide = keyframes`
    from {
        transform: translateX(0);
    }
    to {
        transform: translateX(-100%);
    }
`;

const Root = styled(Dialog.Content)`
    ${tw`
        fixed
        inset-y-0
        left-0
        w-72
        border-r
        border-solid
        border-indigo-700/60
        shadow-2xl
        shadow-indigo-800
        outline-0
        bg-zinc-800
    `}
    z-index: ${getZIndex("side-drawer")};

    &[data-state="open"] {
        animation: ${rootShow} 0.15s ease-in;
    }

    &[data-state="closed"] {
        animation: ${rootHide} 0.15s ease-in;
    }
`;

export interface SideDrawerProps {
    children?: ReactNode;
    className?: string;
    description?: string;
    style?: CSSProperties;
    title?: string;
}

const _SideDrawer: FC<SideDrawerProps> = ({
    children,
    className,
    description,
    style,
    title,
}) => {
    return (
        <Dialog.Portal>
            <Backdrop />
            <Root className={className} style={style}>
                <VisuallyHidden>
                    {!!title && <Dialog.Title>{title}</Dialog.Title>}
                    {!!description && (
                        <Dialog.Description>{description}</Dialog.Description>
                    )}
                </VisuallyHidden>
                {children}
            </Root>
        </Dialog.Portal>
    );
};

_SideDrawer.displayName = "SideDrawer";

export const SideDrawer = Object.assign(_SideDrawer, {
    Root: SideDrawerRoot,
    Trigger: SideDrawerTrigger,
});
