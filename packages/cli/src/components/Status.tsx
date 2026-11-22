import { useState } from "react";
import { useAnimationTick } from "@opentui/react";
import { palette } from "../log/palette";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** A one-line spinner. OpenTUI has no spinner component. */
export const Status = ({ active = true, label }: { active?: boolean; label: string }) => {
    const [frame, setFrame] = useState(0);

    useAnimationTick(10, () => {
        if (!active) return;

        setFrame((current) => (current + 1) % FRAMES.length);
    });

    if (!active) {
        return <text fg={palette.accent}>{label}</text>;
    }

    return (
        <text>
            <span fg={palette.accent}>{FRAMES[frame] ?? "⠋"}</span>
            {` ${label}`}
        </text>
    );
};
