import { Dialog as BaseDialog } from "./Dialog";
import { DialogContent } from "./DialogContent";
import { DialogDescription } from "./DialogDescription";
import { DialogFooter } from "./DialogFooter";
import { DialogHeader } from "./DialogHeader";
import { DialogOverlay } from "./DialogOverlay";
import { DialogPortal } from "./DialogPortal";
import { DialogTitle } from "./DialogTitle";
import { DialogTrigger } from "./DialogTrigger";

export type { DialogProps } from "./Dialog";
export { DialogContent } from "./DialogContent";
export { DialogDescription } from "./DialogDescription";
export { DialogFooter } from "./DialogFooter";
export { DialogHeader } from "./DialogHeader";
export { DialogOverlay } from "./DialogOverlay";
export { DialogPortal } from "./DialogPortal";
export { DialogTitle } from "./DialogTitle";
export { DialogTrigger } from "./DialogTrigger";

export const Dialog = Object.assign(BaseDialog, {
    Description: DialogDescription,
    Portal: DialogPortal,
    Content: DialogContent,
    Footer: DialogFooter,
    Header: DialogHeader,
    Overlay: DialogOverlay,
    Title: DialogTitle,
    Trigger: DialogTrigger,
});
