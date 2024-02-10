import { NextPage } from "next";
import NextLink from "next/link";
import React from "react";

export const Page: NextPage = () => {
    return (
        <div>
            <NextLink href="/cloudflare/presence">presence</NextLink>
            <NextLink href="/cloudflare/storage">storage</NextLink>
        </div>
    );
};

export default Page;
