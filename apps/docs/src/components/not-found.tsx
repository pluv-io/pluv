import { baseOptions } from "@/lib/layout.shared";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { DefaultNotFound } from "fumadocs-ui/layouts/home/not-found";

export const NotFound = () => {
    return (
        <HomeLayout {...baseOptions()}>
            <DefaultNotFound />
        </HomeLayout>
    );
};
