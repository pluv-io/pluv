import type { Meta, StoryObj } from "@storybook/react";
import type { HomeHeroProps } from "@pluv-apps/web/components";
import { HomeHero } from "@pluv-apps/web/components";

export default {
    title: "web/components/HomeHero",
    component: HomeHero,
} as Meta;

type Story = StoryObj<HomeHeroProps>;

const Template: Story = {
    render: (args) => {
        return <HomeHero className="w-full" {...args} />;
    },
};

export const Standard: Story = { ...Template };
