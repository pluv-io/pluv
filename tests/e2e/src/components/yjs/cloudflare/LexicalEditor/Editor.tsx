/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";

import ToolbarPlugin from "./plugins/ToolbarPlugin";
import TreeViewPlugin from "./plugins/TreeViewPlugin";

function Placeholder() {
    return <div className="editor-placeholder">Enter some rich text...</div>;
}

export default function Editor() {
    return (
        <div className="lexical-editor-container">
            <ToolbarPlugin />
            <div className="lexical-editor-inner">
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable id="lexical-editable" className="lexical-editor-input" />
                    }
                    placeholder={<Placeholder />}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <AutoFocusPlugin />
                <TreeViewPlugin />
            </div>
        </div>
    );
}
