import { renderMermaidSVG } from "beautiful-mermaid";

type Parent = { children: unknown[] };

type CodeNode = {
    type: string;
    lang?: string;
    value?: string;
};

const walk = (
    node: unknown,
    visit: (node: CodeNode, index: number | undefined, parent: Parent | undefined) => void,
    index?: number,
    parent?: Parent,
): void => {
    visit(node as CodeNode, index, parent);

    const children = (node as Parent).children;

    if (!Array.isArray(children)) return;

    for (let cursor = 0; cursor < children.length; cursor++) {
        walk(children[cursor], visit, cursor, node as Parent);
    }
};

const render = (chart: string): string => {
    const svg = renderMermaidSVG(chart, {
        accent: "var(--color-fd-primary)",
        bg: "var(--color-fd-background)",
        border: "var(--color-fd-border)",
        fg: "var(--color-fd-foreground)",
        font: "JetBrains Mono Variable",
        line: "var(--color-fd-border)",
        muted: "var(--color-fd-muted-foreground)",
        surface: "var(--color-fd-card)",
        transparent: true,
    });

    return svg.replace(/@import url\([^)]*\);/g, "");
};

/** Renders mermaid fences while the docs compile, so the worker only serves SVG. */
export const remarkMermaid = () => {
    return (tree: Parent) => {
        walk(tree, (node, index, parent) => {
            if (node.type !== "code" || node.lang !== "mermaid" || !parent || index === undefined) {
                return;
            }

            parent.children[index] = {
                type: "mdxJsxFlowElement",
                name: "Mermaid",
                attributes: [
                    {
                        type: "mdxJsxAttribute",
                        name: "svg",
                        value: render(node.value ?? ""),
                    },
                ],
                children: [],
            };
        });
    };
};
