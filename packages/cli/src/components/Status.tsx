import { useState } from "react";
import { useAnimationTick } from "@opentui/react";
import { palette } from "../log/palette";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** A one-line spinner. OpenTUI has no spinner component. */
export const Status = ({ label }: { label: string }) => {
    const [frame, setFrame] = useState(0);

    useAnimationTick(10, () => {
        setFrame((current) => (current + 1) % FRAMES.length);
    });

    return (
        <text>
            <span fg={palette.accent}>{FRAMES[frame] ?? "⠋"}</span>
            {` ${label}`}
        </text>
    );
};
