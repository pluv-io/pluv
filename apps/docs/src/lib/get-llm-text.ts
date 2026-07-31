import type { source } from "@/lib/source";

export const getLLMText = async (page: (typeof source)["$inferPage"]): Promise<string> => {
    const processed = await page.data.getText("processed");

    return `# ${page.data.title} (${page.url})

${processed}`;
};
