import type { ComponentType } from "react";
import type styledImport from "styled-components";
import type { css as cssImport } from "styled-components";
import "twin.macro";

declare module "twin.macro" {
    // The styled and css imports
    export const styled: typeof styledImport;
    export const css: typeof cssImport;

    const tw: typeof css & typeof styledImport;

    export = tw;
}

declare module "react" {
    // The css prop
    interface HTMLAttributes<T> extends DOMAttributes<T> {
        key?: Key | null | undefined;
        css?: any;
    }
    // The inline svg css prop
    interface SVGProps<T> extends SVGProps<SVGSVGElement> {
        css?: any;
    }
}

// The "as" prop on styled components
declare global {
    namespace JSX {
        interface IntrinsicAttributes extends React.Attributes {
            as?: string | ComponentType<any>;
            forwardedAs?: string | ComponentType<any>;
        }
    }
}
