import { ChevronDownIcon } from "@pluv-internal/react-icons";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { m } from "framer-motion";
import { CSSProperties, FC, ReactNode, useState } from "react";
import tw, { styled } from "twin.macro";
import { NextLink } from "../../atoms";

const Root = tw(NavigationMenu.Item)`
    flex
    flex-col
    items-stretch
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

const Item = styled.div`
    ${tw`
        relative
        flex
        flex-row
        items-stretch
        h-8
        [&[data-selected="true"]]:text-sky-500
    `}

    &[data-selected="true"] ${ItemContent} {
        ${tw`before:bg-slate-300/20`}
    }
`;

const StyledIcon = tw(ChevronDownIcon)`
    -rotate-90
    transition
    duration-150
    ease-linear
`;

const ChevronButton = styled.button`
    ${tw`
        flex
        items-center
        justify-center
        w-8
        rounded
        hover:bg-slate-300/10
        focus:bg-slate-300/20
        active:bg-slate-300/40
    `}

    &[aria-expanded="true"] > ${StyledIcon} {
        ${tw`
            rotate-0
        `}
    }
`;

const Content = tw(m.ul)`
    flex
    flex-col
    items-stretch
    gap-0.5
    mt-0.5
    pl-3
    overflow-y-clip
`;

export interface TreeViewListProps {
    children?: ReactNode;
    className?: string;
    content?: ReactNode;
    defaultOpen?: boolean;
    href?: string;
    selected?: boolean;
    style?: CSSProperties;
}

export const TreeViewList: FC<TreeViewListProps> = ({
    children,
    className,
    content,
    defaultOpen = false,
    href,
    selected = false,
    style,
}) => {
    const [open, setOpen] = useState<boolean>(defaultOpen);

    const child = href ? (
        <NavigationMenu.Link asChild>
            <ItemContent
                as={NextLink}
                href={href}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
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
                data-selected={selected}
            >
                {child}
                <ChevronButton aria-expanded={open || selected}>
                    <StyledIcon height={24} width={24} />
                </ChevronButton>
            </Item>
            <Content
                animate={open ? "open" : "default"}
                initial={false}
                variants={{
                    default: { height: 0 },
                    open: { height: "auto" },
                }}
            >
                {content}
            </Content>
        </Root>
    );
};
