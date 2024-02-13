import { NextPage } from "next";
import NextLink from "next/link";
import React from "react";

export const Page: NextPage = () => {
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <NextLink href="/loro/node">loro node</NextLink>
            <NextLink href="/noop/node">noop node</NextLink>
            <NextLink href="/yjs/cloudflare">yjs cloudflare</NextLink>
            <NextLink href="/yjs/node">yjs node</NextLink>
            <NextLink href="/yjs/node-redis">yjs node-redis</NextLink>
        </div>
    );
};

export default Page;
