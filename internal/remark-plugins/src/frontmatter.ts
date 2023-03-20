import { parse } from "acorn";
import matter from "gray-matter";
import type { Parent } from "unist";
import type { VFile } from "vfile";

const removeFrontmatter = (tree: Parent) => {
    if (tree.children[0].type !== "thematicBreak") return;

    const index = tree.children.findIndex(({ type }) => type === "heading");

    if (index === -1) return;

    tree.children.splice(0, index + 1);
};

export const frontmatter = () => (tree: Parent, file: VFile) => {
    const { data } = matter(file.value);

    removeFrontmatter(tree);

    tree.children.unshift({
        type: "mdxjsEsm",
        data: {
            estree: parse(`export const meta = ${JSON.stringify(data)};`, {
                sourceType: "module",
                ecmaVersion: "latest",
            }),
        },
    });
};
