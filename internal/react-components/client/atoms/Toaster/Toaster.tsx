import type { ComponentProps } from "react";
import type { Toaster } from "sonner";

export { toast, Toaster } from "sonner";

export type ToasterProps = ComponentProps<typeof Toaster>;
