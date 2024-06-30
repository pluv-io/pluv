import { Command as BaseCommand } from "./Command";
import { CommandDialog } from "./CommandDialog";
import { CommandEmpty } from "./CommandEmpty";
import { CommandGroup } from "./CommandGroup";
import { CommandInput } from "./CommandInput";
import { CommandItem } from "./CommandItem";
import { CommandList } from "./CommandList";
import { CommandSeparator } from "./CommandSeparator";
import { CommandShortcut } from "./CommandShortcut";
import { CommandStaticGroup } from "./CommandStaticGroup";
import { CommandStaticItem } from "./CommandStaticItem";
import { CommandStaticLink } from "./CommandStaticLink";

export const Command = Object.assign(BaseCommand, {
    Dialog: CommandDialog,
    Empty: CommandEmpty,
    Group: CommandGroup,
    Input: CommandInput,
    Item: CommandItem,
    List: CommandList,
    Separator: CommandSeparator,
    Shortcut: CommandShortcut,
    StaticGroup: CommandStaticGroup,
    StaticItem: CommandStaticItem,
    StaticLink: CommandStaticLink,
});
