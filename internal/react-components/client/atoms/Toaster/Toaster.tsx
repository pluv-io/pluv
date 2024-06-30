import type { InferComponentProps } from "@pluv-internal/typings";
import type { Toaster } from "sonner";

export { toast, Toaster } from "sonner";

export type ToasterProps = InferComponentProps<typeof Toaster>;
