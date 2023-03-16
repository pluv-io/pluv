import { ChevronDownIcon } from "@pluv-internal/react-icons";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { AnimatePresence, m } from "framer-motion";
import { FC, ReactNode, useState } from "react";
import { CSSProperties } from "styled-components";
import tw, { styled } from "twin.macro";
import { NextLink } from "../../atoms";

const Root = tw(NavigationMenu.Item)`
    flex
    flex-col
    items-stretch
`;

const Item = tw.div`
    relative
    flex
    flex-row
    items-stretch
    h-8
`;

const ItemContent = styled.button`
    ${tw`
        grow
        flex
        flex-row
        items-center
        px-3
        font-semibold
        cursor-pointer
    `}

    &::before {
        ${tw`
            content-[""]
            absolute
            inset-0
            rounded
            transition-colors
            duration-150
            ease-in
            cursor-pointer
            bg-slate-300/0
            pointer-events-none
        `}
    }

    ${tw`
        hover:before:bg-slate-300/10
        focus:before:bg-slate-300/20
        active:before:bg-slate-300/40
    `}
`;

const ChevronButton = tw.button`
    flex
    items-center
    justify-center
    w-8
    rounded
    hover:bg-slate-300/10
    focus:bg-slate-300/20
    active:bg-slate-300/40
`;

const Content = tw(m.ul)`
    flex
    flex-col
    items-stretch
    gap-0.5
    pl-3
    overflow-hidden
`;

export interface TreeViewListProps {
    children?: ReactNode;
    className?: string;
    content?: ReactNode;
    href?: string;
    style?: CSSProperties;
}

export const TreeViewList: FC<TreeViewListProps> = ({
    children,
    className,
    content,
    href,
    style,
}) => {
    const [open, setOpen] = useState<boolean>(false);

    const child = href ? (
        <NavigationMenu.Link asChild>
            <ItemContent as={NextLink} href={href}>
                {children}
            </ItemContent>
        </NavigationMenu.Link>
    ) : (
        <ItemContent>{children}</ItemContent>
    );

    return (
        <Root className={className} style={style}>
            <Item
                onClick={() => {
                    setOpen((oldOpen) => !oldOpen);
                }}
            >
                {child}
                <ChevronButton>
                    <ChevronDownIcon height={24} width={24} />
                </ChevronButton>
            </Item>
            <AnimatePresence>
                {open && (
                    <Content
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                    >
                        {content}
                    </Content>
                )}
            </AnimatePresence>
        </Root>
    );
};
