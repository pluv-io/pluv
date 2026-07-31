const escapeHtml = (value: string): string => {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
};

const htmlDocument = (title: string, body: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    padding: 1.5rem;
    background: #fff;
    color: #111;
    font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  @media (prefers-color-scheme: dark) {
    body { background: #111; color: #eee; }
  }
  pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
  a { color: inherit; }
</style>
</head>
<body><pre>${escapeHtml(body)}</pre></body>
</html>`;
};

export const textFileResponse = (request: Request, title: string, body: string): Response => {
    const accept = request.headers.get("accept") ?? "";
    const prefersHtml = accept.includes("text/html") && !accept.includes("text/plain");

    if (prefersHtml) {
        return new Response(htmlDocument(title, body), {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        });
    }

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
};
