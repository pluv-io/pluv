import { InferComponentProps } from "@pluv-internal/typings";
import tw, { styled } from "twin.macro";

export type ButtonVariant =
    | "alert"
    | "error"
    | "primary"
    | "secondary"
    | "success";

export type ButtonProps = InferComponentProps<typeof Button>;

export const Button = styled.button<{
    bounce?: boolean;
    outlined?: boolean;
    size?: "small" | "medium" | "large";
    square?: boolean;
    variant?: ButtonVariant;
}>`
    ${tw`
		relative
		flex
		items-center
		justify-center
		border
		border-solid
		border-transparent
		rounded-md
		font-semibold
		cursor-pointer
		transition
		duration-150
		ease-in-out
		shadow-sm
		transform
		disabled:shadow-none
		disabled:opacity-60
		disabled:cursor-not-allowed
		not-disabled:active:shadow-none
		not-disabled:hover:shadow-md
		not-disabled:hover:opacity-80
		disabled:after:absolute
		disabled:after:inset-0
		disabled:after:pointer-events-auto
		disabled:after:cursor-not-allowed
	`}

    ${({ bounce = true }) => bounce && tw`not-disabled:hover:-translate-y-0.5`}

	${({ outlined, variant = "primary" }) => {
        switch (variant) {
            case "alert":
                return outlined
                    ? tw`border-pink-600`
                    : tw`
                        bg-pink-600
                        text-white
                    `;
            case "error":
                return outlined
                    ? tw`border-rose-600`
                    : tw`
                        bg-rose-600
                        text-white
                    `;
            case "primary":
                return outlined
                    ? tw`border-sky-500`
                    : tw`
                        bg-sky-500
                        text-black
                    `;
            case "secondary":
                return outlined
                    ? tw`border-amber-400`
                    : tw`
                        bg-amber-400
                        text-black
                    `;
            case "success":
                return outlined
                    ? tw`border-emerald-500`
                    : tw`
                        bg-emerald-500
                        text-black
                    `;
            default:
                return null;
        }
    }}

	${({ size = "medium" }) => {
        switch (size) {
            case "large":
                return tw`
					text-lg
					font-bold
				`;
            case "small":
                return tw`
					text-base
					rounded
				`;
            case "medium":
            default:
                return tw`text-lg`;
        }
    }}

${({ size = "medium", square }) => {
        switch (size) {
            case "large":
                return square
                    ? tw`p-3.5`
                    : tw`
                        px-4
                        py-3.5
                    `;
            case "small":
                return square
                    ? tw`p-1`
                    : tw`
                        px-1.5
                        py-1
                    `;
            case "medium":
            default:
                return square
                    ? tw`p-2`
                    : tw`
                        px-2.5
                        py-2
                    `;
        }
    }}

	${tw`leading-snug`}
`;

Button.defaultProps = {
    role: "button",
    type: "button",
};

<Button as="div" />;
