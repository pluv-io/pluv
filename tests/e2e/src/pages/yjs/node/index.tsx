import { NextPage } from "next";
import NextLink from "next/link";
import React from "react";

export const Page: NextPage = () => {
    return (
        <div>
            <NextLink href="/yjs/node/broadcast">broadcast</NextLink>
            <NextLink href="/yjs/node/presence">presence</NextLink>
            <NextLink href="/yjs/node/storage">storage</NextLink>
        </div>
    );
};

export default Page;
