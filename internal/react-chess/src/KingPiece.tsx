import { CSSProperties, FC } from "react";
import tw from "twin.macro";

const Root = tw.svg`
    h-full
    w-full
`;

export interface KingPieceProps {
    className?: string;
    style?: CSSProperties;
}

export const KingPiece: FC<KingPieceProps> = ({ className, style }) => {
    return (
        <Root
            className={className}
            style={style}
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="1 1 43 43"
            height="75"
            width="75"
        >
            <g
                fill="none"
                fillOpacity={1}
                fillRule="evenodd"
                stroke="rgb(0, 0, 0)"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit={4}
                strokeDasharray="none"
                strokeOpacity={1}
            >
                <path fill="none" stroke="rgb(0, 0, 0)" strokeLinejoin="miter" d="M 22.5,11.63 L 22.5,6" />
                <path fill="none" stroke="rgb(0, 0, 0)" strokeLinejoin="miter" d="M 20,8 L 25,8" />
                <path
                    fill="rgb(255, 255, 255)"
                    stroke="rgb(0, 0, 0)"
                    strokeLinecap="butt"
                    strokeLinejoin="miter"
                    d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"
                />
                <path
                    fill="rgb(255, 255, 255)"
                    stroke="rgb(0, 0, 0)"
                    d="M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37"
                />
                <path fill="none" stroke="rgb(0, 0, 0)" d="M 12.5,30 C 18,27 27,27 32.5,30" />
                <path fill="none" stroke="rgb(0, 0, 0)" d="M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5" />
                <path fill="none" stroke="rgb(0, 0, 0)" d="M 12.5,37 C 18,34 27,34 32.5,37" />
            </g>
        </Root>
    );
};
