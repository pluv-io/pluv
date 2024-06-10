import { Seo } from "@pluv-internal/react-components/client";
import type { FC } from "react";

export interface DocsSeoProps {
    description?: string;
    title?: string;
}

export const DocsSeo: FC<DocsSeoProps> = ({ description, title }) => {
    return <Seo description={description} postfix={!!title} title={title ?? "pluv.io"} />;
};
