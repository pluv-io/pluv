import { AlertDialog as BaseAlertDialog } from "./AlertDialog";
import { AlertDialogAction } from "./AlertDialogAction";
import { AlertDialogCancel } from "./AlertDialogCancel";
import { AlertDialogContent } from "./AlertDialogContent";
import { AlertDialogDescription } from "./AlertDialogDescription";
import { AlertDialogFooter } from "./AlertDialogFooter";
import { AlertDialogHeader } from "./AlertDialogHeader";
import { AlertDialogOverlay } from "./AlertDialogOverlay";
import { AlertDialogPortal } from "./AlertDialogPortal";
import { AlertDialogTitle } from "./AlertDialogTitle";
import { AlertDialogTrigger } from "./AlertDialogTrigger";

export * from "./AlertDialogAction";
export * from "./AlertDialogCancel";
export * from "./AlertDialogContent";
export * from "./AlertDialogDescription";
export * from "./AlertDialogFooter";
export * from "./AlertDialogHeader";
export * from "./AlertDialogOverlay";
export * from "./AlertDialogPortal";
export * from "./AlertDialogTitle";
export * from "./AlertDialogTrigger";

export const AlertDialog = Object.assign(BaseAlertDialog, {
    Action: AlertDialogAction,
    Cancel: AlertDialogCancel,
    Content: AlertDialogContent,
    Description: AlertDialogDescription,
    Footer: AlertDialogFooter,
    Header: AlertDialogHeader,
    Overlay: AlertDialogOverlay,
    Portal: AlertDialogPortal,
    Title: AlertDialogTitle,
    Trigger: AlertDialogTrigger,
});
