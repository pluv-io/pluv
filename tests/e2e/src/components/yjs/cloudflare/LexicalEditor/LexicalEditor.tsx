import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { yjs } from "@pluv/crdt-yjs";
import { ConnectionState } from "@pluv/types";
import type { FC } from "react";
import { useCallback, useRef, useState } from "react";
import type { Doc as YDoc } from "yjs";
import { useConnection, useDoc, useRoom } from "../../../../pluv-io/yjs/cloudflare";
import Editor from "./Editor";
import { getRandomUserProfile, UserProfile } from "./getRandomUserProfile";

interface ActiveUserProfile extends UserProfile {
    userId: number;
}

const initialConfig: InitialConfigType = {
    // NOTE: This is critical for collaboration plugin to set editor state to null. It
    // would indicate that the editor should not try to set any default state
    // (not even empty one), and let collaboration plugin do it instead
    editorState: null,
    namespace: "example",
    nodes: [],
    onError: (error: Error) => {
        throw error;
    },
    theme: {},
};

export const LexicalEditor: FC = () => {
    const [userProfile, setUserProfile] = useState(() => getRandomUserProfile());
    const containerRef = useRef<HTMLDivElement | null>(null);

    const room = useRoom();
    const roomDoc = useDoc();
    const connection = useConnection((connection) => connection.state);
    const doc = roomDoc.value;

    const providerFactory = useCallback(
        (id: string, yjsDocMap: Map<string, YDoc>) => {
            if (id !== room.id) throw new Error("Unexpected room id");

            yjsDocMap.set(id, doc);

            return yjs.provider({ doc, field: "lexical", room });
        },
        [doc],
    );

    if (connection !== ConnectionState.Open) return null;

    return (
        <div ref={containerRef}>
            <p>
                <b>My Name:</b>{" "}
                <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) =>
                        setUserProfile((profile) => ({ ...profile, name: e.target.value }))
                    }
                />{" "}
                <input
                    type="color"
                    value={userProfile.color}
                    onChange={(e) =>
                        setUserProfile((profile) => ({ ...profile, color: e.target.value }))
                    }
                />
            </p>
            <LexicalComposer initialConfig={initialConfig}>
                {/* With CollaborationPlugin - we MUST NOT use @lexical/react/LexicalHistoryPlugin */}
                <CollaborationPlugin
                    id={room.id}
                    providerFactory={providerFactory}
                    // Unless you have a way to avoid race condition between 2+ users trying to do bootstrap simultaneously
                    // you should never try to bootstrap on client. It's better to perform bootstrap within Yjs server.
                    shouldBootstrap={false}
                    username={userProfile.name}
                    cursorColor={userProfile.color}
                    cursorsContainerRef={containerRef}
                />
                <Editor />
            </LexicalComposer>
        </div>
    );
};
