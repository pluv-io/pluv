import { Select as BaseSelect } from "./Select";
import { SelectContent } from "./SelectContent";
import { SelectGroup } from "./SelectGroup";
import { SelectItem } from "./SelectItem";
import { SelectLabel } from "./SelectLabel";
import { SelectScrollDownButton } from "./SelectScrollDownButton";
import { SelectScrollUpButton } from "./SelectScrollUpButton";
import { SelectSeparator } from "./SelectSeparator";
import { SelectTrigger } from "./SelectTrigger";
import { SelectValue } from "./SelectValue";

export { SelectContent } from "./SelectContent";
export { SelectGroup } from "./SelectGroup";
export { SelectItem } from "./SelectItem";
export { SelectLabel } from "./SelectLabel";
export { SelectScrollDownButton } from "./SelectScrollDownButton";
export { SelectScrollUpButton } from "./SelectScrollUpButton";
export { SelectSeparator } from "./SelectSeparator";
export { SelectTrigger } from "./SelectTrigger";
export { SelectValue } from "./SelectValue";

export const Select = Object.assign(BaseSelect, {
    Content: SelectContent,
    Group: SelectGroup,
    Item: SelectItem,
    Label: SelectLabel,
    ScrollDownButton: SelectScrollDownButton,
    ScrollUpButton: SelectScrollUpButton,
    Separator: SelectSeparator,
    Trigger: SelectTrigger,
    Value: SelectValue,
});
