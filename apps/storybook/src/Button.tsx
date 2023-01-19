import { FC } from "react";
import "./button.css";

export const Button: FC<{
    primary?: boolean;
    backgroundColor?: string;
    size: "small" | "medium" | "large";
    label: string;
    onClick: () => void;
}> = ({ primary, backgroundColor, size, label, ...props }) => {
    const mode = primary
        ? "storybook-button--primary"
        : "storybook-button--secondary";
    return (
        <button
            type="button"
            className={[
                "storybook-button",
                `storybook-button--${size}`,
                mode,
            ].join(" ")}
            style={{ backgroundColor }}
            {...props}
        >
            {label}
        </button>
    );
};
