import { NextPage } from "next";
import NextLink from "next/link";

export const Page: NextPage = () => {
    return (
        <div>
            <NextLink href="/yjs/cloudflare/presence">presence</NextLink>
            <NextLink href="/yjs/cloudflare/storage">storage</NextLink>
            <NextLink href="/yjs/cloudflare/lexical">lexical</NextLink>
            <NextLink href="/yjs/cloudflare/slate">slate</NextLink>
        </div>
    );
};

export default Page;
