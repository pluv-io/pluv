import { useAudio } from "@pluv-internal/react-hooks";
import type { ReactElement } from "react";
import { useMemo } from "react";

const ASSET_BASE_PREFIX = "https://raw.githubusercontent.com/pluv-io/pluv/master/assets/";

export interface SoundControls {
    element: ReactElement;
    play: () => void;
}

export interface UseChessSounds {
    capture: SoundControls;
    castle: SoundControls;
    check: SoundControls;
    gameEnd: SoundControls;
    move: SoundControls;
    promote: SoundControls;
}

const useGetSoundControl = (fileName: string): SoundControls => {
    const [element, , { play }] = useAudio({
        src: `${ASSET_BASE_PREFIX}${fileName}.webm`,
    });

    return useMemo(() => ({ element, play }), [element, play]);
};

export const useChessSounds = (): UseChessSounds => {
    const capture = useGetSoundControl("capture");
    const castle = useGetSoundControl("castle");
    const check = useGetSoundControl("check");
    const gameEnd = useGetSoundControl("game-end");
    const move = useGetSoundControl("move");
    const promote = useGetSoundControl("promote");

    return {
        capture,
        castle,
        check,
        gameEnd,
        move,
        promote,
    };
};
