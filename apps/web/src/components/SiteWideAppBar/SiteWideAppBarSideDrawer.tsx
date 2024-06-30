"use client";

import { SideDrawer } from "@pluv-internal/react-components/client";
import { Button } from "@pluv-internal/react-components/either";
import { BarsIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import { memo, useState } from "react";
import { MobileDocsSideDrawer } from "../MobileDocsSideDrawer";

interface SiteWideAppBarSideDrawerProps {
    className?: string;
}

export const SiteWideAppBarSideDrawer = memo<SiteWideAppBarSideDrawerProps>(({ className }) => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <SideDrawer.Root
            open={open}
            onOpenChange={(newOpen) => {
                setOpen(newOpen);
            }}
        >
            <SideDrawer.Trigger>
                <Button className={cn("xl:hidden", className)} size="icon" type="button" variant="outline">
                    <BarsIcon height={24} width={24} />
                </Button>
            </SideDrawer.Trigger>
            <MobileDocsSideDrawer
                className="xl:hidden"
                onClickLink={(e) => {
                    e.stopPropagation();

                    setOpen(false);
                }}
            />
        </SideDrawer.Root>
    );
});

SiteWideAppBarSideDrawer.displayName = "SiteWideAppBarSideDrawer";
