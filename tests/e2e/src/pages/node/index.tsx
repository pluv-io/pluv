import { NextPage } from "next";
import NextLink from "next/link";
import React from "react";

export const Page: NextPage = () => {
    return (
        <div>
            <NextLink href="/node/presence">presence</NextLink>
            <NextLink href="/node/storage">storage</NextLink>
        </div>
    );
};

export default Page;
