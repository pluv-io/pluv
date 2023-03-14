import "twin.macro";
import type styledImport, {
    css as cssImport,
    StyledComponent,
} from "styled-components";
import type { ComponentType } from "react";

declare module "twin.macro" {
    // The styled and css imports
    export const styled: typeof styledImport;
    export const css: typeof cssImport;

    type TwComponentWrapper = <T extends ComponentType<any>>(
        component: T
    ) => TemplateFn<StyledComponent<T, any, {}, never>>;

    const tw: TwFn & TwComponentWrapper & typeof styledImport;

    export = tw;
}

declare module "react" {
    // The css prop
    interface HTMLAttributes<T> extends DOMAttributes<T> {
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
        interface IntrinsicAttributes<T> extends DOMAttributes<T> {
            as?: string | ComponentType<any>;
            forwardedAs?: string | ComponentType<any>;
        }
    }
}
