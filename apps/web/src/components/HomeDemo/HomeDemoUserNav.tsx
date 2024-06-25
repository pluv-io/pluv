import { Avatar, DropdownMenu } from "@pluv-internal/react-components/client";
import { Button } from "@pluv-internal/react-components/either";
import type { FC } from "react";
import { useConnection } from "../../pluv-io/cloudflare";

export interface HomeDemoUserNavProps {}

export const HomeDemoUserNav: FC<HomeDemoUserNavProps> = () => {
    const connectionId = useConnection((connection) => connection.id);

    return (
        <DropdownMenu>
            <DropdownMenu.Trigger asChild>
                <Button variant="ghost" className="relative size-8 rounded-full">
                    <Avatar className="size-8">
                        <Avatar.Animal data={connectionId} height={32} width={32} />
                    </Avatar>
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="w-56" align="end" forceMount>
                <DropdownMenu.Label className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            Anonymous {Avatar.Animal.getAnimal(connectionId)}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">m@example.com</p>
                    </div>
                </DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Group>
                    <DropdownMenu.Item>
                        Profile
                        <DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                        Billing
                        <DropdownMenu.Shortcut>⌘B</DropdownMenu.Shortcut>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                        Settings
                        <DropdownMenu.Shortcut>⌘S</DropdownMenu.Shortcut>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>New Team</DropdownMenu.Item>
                </DropdownMenu.Group>
                <DropdownMenu.Separator />
                <DropdownMenu.Item>
                    Log out
                    <DropdownMenu.Shortcut>⇧⌘Q</DropdownMenu.Shortcut>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu>
    );
};
