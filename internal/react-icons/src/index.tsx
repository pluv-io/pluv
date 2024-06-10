import type { InferComponentProps } from "@pluv-internal/typings";
import * as React from "react";
import type { Ref, SVGProps } from "react";

export type SvgIconComponent = typeof BarsIcon;
export type SvgIconComponentProps = InferComponentProps<SvgIconComponent>;

export const BarsIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={16} height={16} ref={ref} {...props}>
            <path
                fill="currentColor"
                d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z"
            />
        </svg>
    )),
);
export const CalendarIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <rect width={18} height={18} x={3} y={4} rx={2} ry={2} />
            <line x1={16} x2={16} y1={2} y2={6} />
            <line x1={8} x2={8} y1={2} y2={6} />
            <line x1={3} x2={21} y1={10} y2={10} />
        </svg>
    )),
);
export const CheckIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )),
);
export const ChevronDownIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    )),
);
export const ChevronRightIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )),
);
export const ChevronUpDownIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
        </svg>
    )),
);
export const CircleIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <circle cx={12} cy={12} r={10} />
        </svg>
    )),
);
export const CircleLoaderIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )),
);
export const CreditCardIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <rect width={20} height={14} x={2} y={5} rx={2} />
            <line x1={2} x2={22} y1={10} y2={10} />
        </svg>
    )),
);
export const DotsHorizontalIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <circle cx={12} cy={12} r={1} />
            <circle cx={19} cy={12} r={1} />
            <circle cx={5} cy={12} r={1} />
        </svg>
    )),
);
export const EyeIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx={12} cy={12} r={3} />
        </svg>
    )),
);
export const EyeOffIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1={2} x2={22} y1={2} y2={22} />
        </svg>
    )),
);
export const FileDirectoryIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={24}
            height={24}
            fill="currentColor"
            ref={ref}
            {...props}
        >
            <path d="M2 4.75C2 3.784 2.784 3 3.75 3h4.971c.58 0 1.12.286 1.447.765l1.404 2.063c.046.069.124.11.207.11h8.471c.966 0 1.75.783 1.75 1.75V19.25A1.75 1.75 0 0 1 20.25 21H3.75A1.75 1.75 0 0 1 2 19.25Zm1.75-.25a.25.25 0 0 0-.25.25v14.5c0 .138.112.25.25.25h16.5a.25.25 0 0 0 .25-.25V7.687a.25.25 0 0 0-.25-.25h-8.471a1.75 1.75 0 0 1-1.447-.765L8.928 4.61a.252.252 0 0 0-.208-.11Z" />
        </svg>
    )),
);
export const GitBranchIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <line x1={6} x2={6} y1={3} y2={15} />
            <circle cx={18} cy={6} r={3} />
            <circle cx={6} cy={18} r={3} />
            <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
    )),
);
export const GitCommitHorizontalIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <circle cx={12} cy={12} r={3} />
            <line x1={3} x2={9} y1={12} y2={12} />
            <line x1={15} x2={21} y1={12} y2={12} />
        </svg>
    )),
);
export const GitHubIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            role="img"
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
    )),
);
export const HelpCircleIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <circle cx={12} cy={12} r={10} />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
        </svg>
    )),
);
export const HomeIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} ref={ref} {...props}>
            <path
                fill="currentColor"
                d="M12.97 2.59a1.5 1.5 0 0 0-1.94 0l-7.5 6.363A1.5 1.5 0 0 0 3 10.097V19.5A1.5 1.5 0 0 0 4.5 21h4.75a.75.75 0 0 0 .75-.75V14h4v6.25c0 .414.336.75.75.75h4.75a1.5 1.5 0 0 0 1.5-1.5v-9.403a1.5 1.5 0 0 0-.53-1.144l-7.5-6.363Z"
            />
        </svg>
    )),
);
export const InfoIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <circle cx={12} cy={12} r={10} />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    )),
);
export const LinkIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} ref={ref} {...props}>
            <path
                fill="currentColor"
                d="M14.78 3.653a3.936 3.936 0 1 1 5.567 5.567l-3.627 3.627a3.936 3.936 0 0 1-5.88-.353.75.75 0 0 0-1.18.928 5.436 5.436 0 0 0 8.12.486l3.628-3.628a5.436 5.436 0 1 0-7.688-7.688l-3 3a.75.75 0 0 0 1.06 1.061l3-3Z"
            />
            <path
                fill="currentColor"
                d="M7.28 11.153a3.936 3.936 0 0 1 5.88.353.75.75 0 0 0 1.18-.928 5.436 5.436 0 0 0-8.12-.486L2.592 13.72a5.436 5.436 0 1 0 7.688 7.688l3-3a.75.75 0 1 0-1.06-1.06l-3 3a3.936 3.936 0 0 1-5.567-5.568l3.627-3.627Z"
            />
        </svg>
    )),
);
export const LockIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <rect width={18} height={11} x={3} y={11} rx={2} ry={2} />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )),
);
export const LogoutIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1={21} x2={9} y1={12} y2={12} />
        </svg>
    )),
);
export const MinusCircleIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <circle cx={12} cy={12} r={10} />
            <path d="M8 12h8" />
        </svg>
    )),
);
export const MonitorIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <rect width={20} height={14} x={2} y={3} rx={2} />
            <line x1={8} x2={16} y1={21} y2={21} />
            <line x1={12} x2={12} y1={17} y2={21} />
        </svg>
    )),
);
export const MoonIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
    )),
);
export const NpmIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg height={512} width={512} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props}>
            <title>{"Npm"}</title>
            <path fill="currentColor" d="M0,0v512h512V0H0z M416.1,416.1h-64.2v-256H256v256H95.9V95.9h320.2V416.1z" />
        </svg>
    )),
);
export const PlusCircleIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <circle cx={12} cy={12} r={10} />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
        </svg>
    )),
);
export const PlusIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )),
);
export const SearchIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )),
);
export const SettingsIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx={12} cy={12} r={3} />
        </svg>
    )),
);
export const SlashIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ref={ref} {...props}>
            <path d="M9.75 20.25L14.25 3.75" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
    )),
);
export const SunIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <circle cx={12} cy={12} r={4} />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
        </svg>
    )),
);
export const UserIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx={12} cy={7} r={4} />
        </svg>
    )),
);
export const XCircleIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <circle cx={12} cy={12} r={10} />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </svg>
    )),
);
export const XIcon = React.memo(
    React.forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
            {...props}
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )),
);
