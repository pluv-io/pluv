import { createFileRoute } from "@tanstack/react-router";
import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";
import { textFileResponse } from "@/lib/text-file-response";

export const Route = createFileRoute("/llms-full.txt")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const scanned = await Promise.all(source.getPages().map(getLLMText));

                return textFileResponse(request, "llms-full.txt", scanned.join("\n\n"));
            },
        },
    },
});
