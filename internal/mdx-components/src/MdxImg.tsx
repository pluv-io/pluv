import type { ComponentProps } from "react";
import NextImage from "next/image";
import { forwardRef } from "react";

export type MdxImgProps = ComponentProps<"img">;

export const MdxImg = forwardRef<HTMLImageElement, MdxImgProps>((props, ref) => {
    const { alt = "", className, height, src, width, ...restProps } = props;

    if (!src) return null;

    return (
        <NextImage
            {...restProps}
            className={className}
            alt={alt}
            height={height as number}
            layout="responsive"
            src={src}
            ref={ref}
            width={width as number}
        />
    );
});

MdxImg.displayName = "MdxImg";
