import { LazyMotion } from "@pluv-internal/react-components/client";
import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react";
import { Inter } from "next/font/google";
import React, { type ComponentType } from "react";

import "@pluv-internal/react-code/styles.css";
import "@pluv-internal/react-components/styles.css";
import "../src/styles/tailwind.css";

const DEFAULT_VIEWPORT_HEIGHT = "1200px";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    viewport: {
      viewports: {
        "2xs": {
          name: "2xs",
          styles: {
            width: "360px",
            height: "640px",
          },
        },
        xs: {
          name: "xs",
          styles: {
            width: "475px",
            height: "800px",
          },
        },
        sm: {
          name: "sm",
          styles: {
            width: "640px",
            height: "960px",
          },
        },
        md: {
          name: "md",
          styles: {
            width: "768px",
            height: "1024px",
          },
        },
        lg: {
          name: "lg",
          styles: {
            width: "1024px",
            height: DEFAULT_VIEWPORT_HEIGHT,
          },
        },
        xl: {
          name: "xl",
          styles: {
            width: "1280px",
            height: DEFAULT_VIEWPORT_HEIGHT,
          },
        },
        "2xl": {
          name: "2xl",
          styles: {
            width: "1536px",
            height: DEFAULT_VIEWPORT_HEIGHT,
          },
        },
      },
    },
  },
  decorators: [
    (Story: ComponentType) => {
      return (
        <LazyMotion>
          <div className={inter.className}>
            <Story />
          </div>
        </LazyMotion>
      );
    },
    withThemeByClassName({
      themes: {
        // nameOfTheme: 'classNameForTheme',
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
