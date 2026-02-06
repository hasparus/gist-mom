import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

export function Preview({ content }: { content: string }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(content, { async: false })),
    [content]
  );

  return (
    <div
      className="preview prose prose-sm max-w-none px-8 py-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
