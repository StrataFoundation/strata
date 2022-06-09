import React, { useEffect, useRef } from "react";

const defaultStyle = {
    display: "block",
    overflow: "hidden",
    resize: "none",
    width: "100%",
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    boxShadow: "none"
};

export function ChatInput(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "0px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + "px";
    }
  }, [props.value]);

  return (
    <textarea
      placeholder="Say something. gm..."
      ref={textareaRef}
      // @ts-ignore
      style={{ ...defaultStyle, ...props.style }}
      {...props}
    />
  );
}