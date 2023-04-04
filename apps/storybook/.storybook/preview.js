import { LaserWaveTheme } from "@pluv-internal/react-code";
import { GlobalStyles, LazyMotion } from "@pluv-internal/react-components";
import { RouterContext } from "next/dist/shared/lib/router-context";
import React from "react";

const DEFAULT_VIEWPORT_HEIGHT = "1200px";

export const parameters = {
	actions: { argTypesRegex: "^on[A-Z].*" },
	controls: {
		matchers: {
			color: /(background|color)$/i,
			date: /Date$/,
		},
	},
	nextRouter: {
		Provider: RouterContext.Provider,
	},
	viewport: {
		viewports: {
			"2xs": {
				name: "2xs",
				styles: {
					width: "360px",
					height: "640px"
				}
			},
			xs: {
				name: "xs",
				styles: {
					width: "475px",
					height: "800px"
				}
			},
			sm: {
				name: "sm",
				styles: {
					width: "640px",
					height: "960px"
				}
			},
			md: {
				name: "md",
				styles: {
					width: "768px",
					height: "1024px"
				}
			},
			lg: {
				name: "lg",
				styles: {
					width: "1024px",
					height: DEFAULT_VIEWPORT_HEIGHT
				}
			},
			xl: {
				name: "xl",
				styles: {
					width: "1280px",
					height: DEFAULT_VIEWPORT_HEIGHT
				}
			},
			"2xl": {
				name: "2xl",
				styles: {
					width: "1536px",
					height: DEFAULT_VIEWPORT_HEIGHT
				}
			}
		}
	}
};

export const decorators = [
	(Story) => (
		<>
			<GlobalStyles />
			<LaserWaveTheme />
			<LazyMotion>
				<Story />
			</LazyMotion>
		</>
	)
];
