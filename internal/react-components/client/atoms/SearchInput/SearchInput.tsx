import { SearchIcon, XCircleIcon } from "@pluv-internal/react-icons";
import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";
import { Spinner } from "../../../either/atoms/Spinner";

export type SearchInputProps = ComponentProps<"input"> & {
    isLoading?: boolean;
    onClear?: () => void;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, disabled, isLoading, onClear, ...props }, ref) => {
        const LeftIcon = isLoading ? Spinner : SearchIcon;

        return (
            <div
                className={cn(
                    oneLine`
                        flex
                        items-center
                        rounded-md
                        border
                        border-input
                        bg-background
                        pl-3
                        ring-offset-background
                        aria-disabled:cursor-not-allowed
                        aria-disabled:opacity-50
                        [&:has(:focus-visible)]:outline-none
                        [&:has(:focus-visible)]:ring-2
                        [&:has(:focus-visible)]:ring-ring
                        [&:has(:focus-visible)]:ring-offset-2
                    `,
                    className,
                )}
                aria-disabled={disabled}
            >
                <LeftIcon className="mr-2 size-4 shrink-0 opacity-50" height={16} width={16} />
                <input
                    ref={ref}
                    className={oneLine`
                        flex
                        h-10
                        w-full
                        bg-transparent
                        py-2
                        text-sm
                        outline-none
                        placeholder:text-muted-foreground
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        [&::-webkit-search-cancel-button]:hidden
                    `}
                    disabled={disabled}
                    type="search"
                    {...props}
                />
                {!!onClear && (
                    <button
                        className="ml-2 flex size-10 items-center justify-center rounded-r-md text-neutral-500 transition-colors duration-100 ease-in hover:text-foreground"
                        onClick={() => {
                            onClear?.();
                        }}
                        type="button"
                    >
                        <XCircleIcon className="size-4 shrink-0 opacity-50" height={16} width={16} />
                    </button>
                )}
            </div>
        );
    },
);
SearchInput.displayName = "SearchInput";
