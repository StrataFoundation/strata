import Prism from "prismjs";
import React, { KeyboardEventHandler, useCallback, useMemo } from "react";
import {
  Slate,
  Editable,
  withReact,
} from "slate-react";
import {
  Element as SlateElement,
  Text,
  createEditor,
  Range,
  Editor,
  Transforms,
  Descendant,
  Point,
} from "slate";
import { withHistory } from "slate-history";
import { css } from "@emotion/css";
import escapeHtml from "escape-html";

const SHORTCUTS: Record<string, string> = {
  "*": "list-item",
  "-": "list-item",
  "+": "list-item",
  ">": "block-quote",
  "`": "code"
};

const serialize = (node: any): string => {
  if (Array.isArray(node)) {
    return node.map(serialize).join("")
  }

  if (Text.isText(node)) {
    let string = escapeHtml(node.text);
    // @ts-ignore
    if (node.bold) {
      string = `<strong>${string}</strong>`;
    }
    return string;
  }

  const children = (node.children || []).map((n: any) => serialize(n)).join("");

  switch (node.type) {
    case "quote":
      return `<blockquote><p>${children}</p></blockquote>`;
    case "paragraph":
      return `<p>${children}</p>`;
    case "link":
      return `<a href="${escapeHtml(node.url)}">${children}</a>`;
    default:
      return children;
  }
};

type BulletedListElement = {
  type: "bulleted-list";
  align?: string;
  children: Descendant[];
};

const withShortcuts = (editor: Editor) => {
  const { deleteBackward, insertText } = editor;

  let prevText = [];
  editor.insertText = (text: any) => {
    const { selection } = editor;

    console.log(text, selection )
    if (text === " " && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      const block = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n),
      });
      const path = block ? block[1] : [];
      const start = Editor.start(editor, path);
      const range = { anchor, focus: start };
      const beforeText = Editor.string(editor, range);
      const type = SHORTCUTS[beforeText];

      if (type) {
        Transforms.select(editor, range);
        Transforms.delete(editor);
        const newProperties: Partial<SlateElement> = {
          // @ts-ignore
          type,
        };
        Transforms.setNodes<SlateElement>(editor, newProperties, {
          match: (n) => Editor.isBlock(editor, n),
        });

        if (type === "list-item") {
          const list: BulletedListElement = {
            type: "bulleted-list",
            children: [],
          };
          Transforms.wrapNodes(editor, list, {
            match: (n) =>
              !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              // @ts-ignore
              n.type === "list-item",
          });
        }

        return;
      }
    }

    insertText(text);
  };

  editor.deleteBackward = (...args) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n),
      });

      if (match) {
        const [block, path] = match;
        const start = Editor.start(editor, path);

        if (
          !Editor.isEditor(block) &&
          SlateElement.isElement(block) &&
          // @ts-ignore
          block.type !== "paragraph" &&
          Point.equals(selection.anchor, start)
        ) {
          const newProperties: Partial<SlateElement> = {
            // @ts-ignore
            type: "paragraph",
          };
          Transforms.setNodes(editor, newProperties);

          // @ts-ignore
          if (block.type === "list-item") {
            Transforms.unwrapNodes(editor, {
              match: (n) =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                // @ts-ignore
                n.type === "bulleted-list",
              split: true,
            });
          }

          return;
        }
      }

      deleteBackward(...args);
    }
  };

  return editor;
};

const Element = ({ attributes, children, element }: any) => {
  switch (element.type) {
    case "block-quote":
      return <blockquote {...attributes}>{children}</blockquote>;
    case "bulleted-list":
      return <ul style={{ marginLeft: "20px" }} {...attributes}>{children}</ul>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "code":
      return <code {...attributes}>{children}</code>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

export const MarkdownInput = ({
  onChange,
  onKeyDown,
  disabled,
}: {
  onChange: (htmlString: string) => void;
  disabled: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}) => {
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const editor = useMemo(
    // @ts-ignore
    () => withShortcuts(withReact(withHistory(createEditor()))),
    []
  );
  return (
    <Slate
      onChange={(e) => {
        console.log(e)
        onChange(serialize(e))
      }}
      //@ts-ignore
      editor={editor}
      value={[
        {
          // @ts-ignore
          type: "paragraph",
          children: [
            {
              text: "",
            },
          ],
        },
      ]}
    >
      <Editable
        readOnly={disabled}
        onKeyDown={onKeyDown}
        style={{ width: "100%" }}
        renderElement={renderElement}
        placeholder="Say something cool, like gm..."
      />
    </Slate>
  );
};
