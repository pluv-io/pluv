import { LaserWaveTheme } from "@pluv-internal/react-code";
import { GlobalStyles } from "@pluv-internal/react-components";
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

import * as WebNextImage from "../../web/node_modules/next/image";

const overwriteNextImage = (nextImage) => {
	const OriginalNextImage = nextImage.default;

	Object.defineProperty(nextImage, "default", {
		configurable: true,
		value: (props) => (
			<OriginalNextImage
				{...props}
				unoptimized
				blurDataURL="data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAbEAADAAMBAQAAAAAAAAAAAAABAgMABAURUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAECEf/aAAwDAQACEQMRAD8Anz9voy1dCI2mectSE5ioFCqia+KCwJ8HzGMZPqJb1oPEf//Z"
				loader={({ src }) => src}
			/>
		)
	});
};

overwriteNextImage(WebNextImage);

export const decorators = [
	(Story) => (
		<>
			<GlobalStyles />
			<LaserWaveTheme />
			<Story />
		</>
	)
];
