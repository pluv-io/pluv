import { NextPage } from "next";
import NextLink from "next/link";
import React from "react";

export const Page: NextPage = () => {
    return (
        <div>
            <NextLink href="/noop/node/presence">presence</NextLink>
        </div>
    );
};

export default Page;
