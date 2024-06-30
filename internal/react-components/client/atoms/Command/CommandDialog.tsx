import { oneLine } from "common-tags";
import { FC } from "react";
import { Dialog, DialogProps } from "../Dialog";
import { Command } from "./Command";

export type CommandDialogProps = DialogProps;

export const CommandDialog: FC<CommandDialogProps> = ({ children, ...props }) => {
    return (
        <Dialog {...props}>
            <Dialog.Content className="overflow-hidden p-0 shadow-lg">
                <Command
                    className={oneLine`
                        [&_[cmdk-group-heading]]:px-2
                        [&_[cmdk-group-heading]]:font-medium
                        [&_[cmdk-group-heading]]:text-muted-foreground
                        [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0
                        [&_[cmdk-group]]:px-2
                        [&_[cmdk-input-wrapper]_svg]:h-5
                        [&_[cmdk-input-wrapper]_svg]:w-5
                        [&_[cmdk-input]]:h-12
                        [&_[cmdk-item]]:px-2
                        [&_[cmdk-item]]:py-3
                        [&_[cmdk-item]_svg]:h-5
                        [&_[cmdk-item]_svg]:w-5
                    `}
                >
                    {children}
                </Command>
            </Dialog.Content>
        </Dialog>
    );
};
