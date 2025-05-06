import { NextPage } from "next";
import NextLink from "next/link";

export const Page: NextPage = () => {
    return (
        <div>
            <NextLink href="/yjs/node-redis/presence">presence</NextLink>
            <NextLink href="/yjs/node-redis/storage">storage</NextLink>
            <NextLink href="/yjs/node-redis/slate">slate</NextLink>
        </div>
    );
};

export default Page;
