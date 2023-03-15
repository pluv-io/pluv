import NextImage from "next/legacy/image";
import { CSSProperties, FC } from "react";

export interface MdxImgProps {
    alt?: string;
    className?: string;
    src?: string;
    style?: CSSProperties;
}

export const MdxImg: FC<MdxImgProps> = ({ alt, className, src, style }) => {
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
