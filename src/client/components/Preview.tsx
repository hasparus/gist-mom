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
      className="preview prose prose-sm dark:prose-invert max-w-none px-3 py-2 sm:px-8 sm:py-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
