import { createFileRoute } from "@tanstack/react-router";
import { llms } from "fumadocs-core/source";
import { source } from "@/lib/source";
import { textFileResponse } from "@/lib/text-file-response";

export const Route = createFileRoute("/llms.txt")({
    server: {
        handlers: {
            GET({ request }) {
                const body = `${llms(source).index()}

## Optional

- [Full documentation](/llms-full.txt): Complete docs content concatenated for LLM ingestion.
`;

                return textFileResponse(request, "llms.txt", body);
            },
        },
    },
});
