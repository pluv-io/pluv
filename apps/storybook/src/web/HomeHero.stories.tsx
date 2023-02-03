import type { Meta, Story } from "@storybook/react";
import type { HomeHeroProps } from "@pluv-apps/web/components";
import { HomeHero } from "@pluv-apps/web/components";

export default {
    title: "web/HomeHero",
    component: HomeHero,
} as Meta;

const Template: Story<HomeHeroProps> = (args) => {
    return <HomeHero className="h-[600px] w-full" {...args} />;
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
