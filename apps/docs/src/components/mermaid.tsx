import type { FC } from "react";

export type MermaidProps = {
    svg: string;
};

export const Mermaid: FC<MermaidProps> = ({ svg }) => {
    return (
        <div
            className="not-prose my-6 overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};
