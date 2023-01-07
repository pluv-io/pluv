import { NextPage } from "next";
import NextLink from "next/link";
import React from "react";

export const Page: NextPage = () => {
    return (
        <div>
            <NextLink href="/cloudflare">cloudflare</NextLink>
            <NextLink href="/node">node</NextLink>
            <NextLink href="/node-redis">node-redis</NextLink>
        </div>
    );
};

export default Page;
