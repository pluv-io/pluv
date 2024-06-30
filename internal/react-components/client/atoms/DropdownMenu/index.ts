import { DropdownMenu as BaseDropdownMenu } from "./DropdownMenu";
import { DropdownMenuCheckboxItem } from "./DropdownMenuCheckboxItem";
import { DropdownMenuContent } from "./DropdownMenuContent";
import { DropdownMenuGroup } from "./DropdownMenuGroup";
import { DropdownMenuItem } from "./DropdownMenuItem";
import { DropdownMenuItemLink } from "./DropdownMenuItemLink";
import { DropdownMenuLabel } from "./DropdownMenuLabel";
import { DropdownMenuPortal } from "./DropdownMenuPortal";
import { DropdownMenuRadioGroup } from "./DropdownMenuRadioGroup";
import { DropdownMenuRadioItem } from "./DropdownMenuRadioItem";
import { DropdownMenuSeparator } from "./DropdownMenuSeparator";
import { DropdownMenuShortcut } from "./DropdownMenuShortcut";
import { DropdownMenuSub } from "./DropdownMenuSub";
import { DropdownMenuSubContent } from "./DropdownMenuSubContent";
import { DropdownMenuSubTrigger } from "./DropdownMenuSubTrigger";
import { DropdownMenuTrigger } from "./DropdownMenuTrigger";

export { DropdownMenuCheckboxItem } from "./DropdownMenuCheckboxItem";
export { DropdownMenuContent } from "./DropdownMenuContent";
export { DropdownMenuGroup } from "./DropdownMenuGroup";
export { DropdownMenuItem } from "./DropdownMenuItem";
export { DropdownMenuItemLink } from "./DropdownMenuItemLink";
export { DropdownMenuLabel } from "./DropdownMenuLabel";
export { DropdownMenuPortal } from "./DropdownMenuPortal";
export { DropdownMenuRadioGroup } from "./DropdownMenuRadioGroup";
export { DropdownMenuRadioItem } from "./DropdownMenuRadioItem";
export { DropdownMenuSeparator } from "./DropdownMenuSeparator";
export { DropdownMenuShortcut } from "./DropdownMenuShortcut";
export { DropdownMenuSub } from "./DropdownMenuSub";
export { DropdownMenuSubContent } from "./DropdownMenuSubContent";
export { DropdownMenuSubTrigger } from "./DropdownMenuSubTrigger";
export { DropdownMenuTrigger } from "./DropdownMenuTrigger";

export const DropdownMenu = Object.assign(BaseDropdownMenu, {
    CheckboxItem: DropdownMenuCheckboxItem,
    Content: DropdownMenuContent,
    Group: DropdownMenuGroup,
    Item: DropdownMenuItem,
    ItemLink: DropdownMenuItemLink,
    Label: DropdownMenuLabel,
    Portal: DropdownMenuPortal,
    RadioGroup: DropdownMenuRadioGroup,
    RadioItem: DropdownMenuRadioItem,
    Separator: DropdownMenuSeparator,
    Shortcut: DropdownMenuShortcut,
    Sub: DropdownMenuSub,
    SubContent: DropdownMenuSubContent,
    SubTrigger: DropdownMenuSubTrigger,
    Trigger: DropdownMenuTrigger,
});
