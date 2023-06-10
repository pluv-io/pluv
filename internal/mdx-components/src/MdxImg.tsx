import NextImage from "next/legacy/image";
import { CSSProperties, FC, ReactElement } from "react";

export interface MdxImgProps {
    alt?: string;
    className?: string;
    src?: string;
    style?: CSSProperties;
}

export const MdxImg = ({
    alt,
    className,
    src,
    style,
}: MdxImgProps): ReactElement | null => {
    if (!src) return null;

    return (
        <NextImage
            className={className}
            alt={alt}
            layout="responsive"
            src={src}
            style={style}
        />
    );
};
