import type { InferComponentProps } from "@pluv-internal/typings";
import * as React from "react";
import type { Ref, SVGProps } from "react";

export type SvgIconComponent = typeof BarsIcon;
export type SvgIconComponentProps = InferComponentProps<SvgIconComponent>;

export const BarsIcon = React.memo(
    React.forwardRef(
        (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                width={16}
                height={16}
                ref={ref}
                {...props}
            >
                <path
                    fill="currentColor"
                    d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z"
                />
            </svg>
        )
    )
);
export const ChevronDownIcon = React.memo(
    React.forwardRef(
        (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={24}
                height={24}
                ref={ref}
                {...props}
            >
                <path
                    fillRule="evenodd"
                    fill="currentColor"
                    d="M5.22 8.72a.75.75 0 000 1.06l6.25 6.25a.75.75 0 001.06 0l6.25-6.25a.75.75 0 00-1.06-1.06L12 14.44 6.28 8.72a.75.75 0 00-1.06 0z"
                />
            </svg>
        )
    )
);
export const GitHubIcon = React.memo(
    React.forwardRef(
        (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
            <svg
                height={24}
                width={24}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                ref={ref}
                {...props}
            >
                <title>{"GitHub"}</title>
                <path
                    fill="currentColor"
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                />
            </svg>
        )
    )
);
export const HomeIcon = React.memo(
    React.forwardRef(
        (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={24}
                height={24}
                ref={ref}
                {...props}
            >
                <path
                    fill="currentColor"
                    d="M12.97 2.59a1.5 1.5 0 0 0-1.94 0l-7.5 6.363A1.5 1.5 0 0 0 3 10.097V19.5A1.5 1.5 0 0 0 4.5 21h4.75a.75.75 0 0 0 .75-.75V14h4v6.25c0 .414.336.75.75.75h4.75a1.5 1.5 0 0 0 1.5-1.5v-9.403a1.5 1.5 0 0 0-.53-1.144l-7.5-6.363Z"
                />
            </svg>
        )
    )
);
export const LinkIcon = React.memo(
    React.forwardRef(
        (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={24}
                height={24}
                ref={ref}
                {...props}
            >
                <path
                    fill="currentColor"
                    d="M14.78 3.653a3.936 3.936 0 1 1 5.567 5.567l-3.627 3.627a3.936 3.936 0 0 1-5.88-.353.75.75 0 0 0-1.18.928 5.436 5.436 0 0 0 8.12.486l3.628-3.628a5.436 5.436 0 1 0-7.688-7.688l-3 3a.75.75 0 0 0 1.06 1.061l3-3Z"
                />
                <path
                    fill="currentColor"
                    d="M7.28 11.153a3.936 3.936 0 0 1 5.88.353.75.75 0 0 0 1.18-.928 5.436 5.436 0 0 0-8.12-.486L2.592 13.72a5.436 5.436 0 1 0 7.688 7.688l3-3a.75.75 0 1 0-1.06-1.06l-3 3a3.936 3.936 0 0 1-5.567-5.568l3.627-3.627Z"
                />
            </svg>
        )
    )
);
export const NpmIcon = React.memo(
    React.forwardRef(
        (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
            <svg
                height={512}
                width={512}
                viewBox="0 0 512 512"
                xmlns="http://www.w3.org/2000/svg"
                ref={ref}
                {...props}
            >
                <title>{"Npm"}</title>
                <path
                    fill="currentColor"
                    d="M0,0v512h512V0H0z M416.1,416.1h-64.2v-256H256v256H95.9V95.9h320.2V416.1z"
                />
            </svg>
        )
    )
);
export const XIcon = React.memo(
    React.forwardRef(
        (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={24}
                height={24}
                ref={ref}
                {...props}
            >
                <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M5.72 5.72a.75.75 0 011.06 0L12 10.94l5.22-5.22a.75.75 0 111.06 1.06L13.06 12l5.22 5.22a.75.75 0 11-1.06 1.06L12 13.06l-5.22 5.22a.75.75 0 01-1.06-1.06L10.94 12 5.72 6.78a.75.75 0 010-1.06z"
                />
            </svg>
        )
    )
);
