import Markdown, { Components } from "react-markdown";
import manualMarkdown from "../../../manual/MANUAL_DE_UTILIZACAO.md?raw";

const components: Components = {
  h1: ({ children }) => <h1 className="mb-4 text-2xl font-bold text-gray-100">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-8 text-lg font-bold text-gray-100">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 mt-4 text-sm font-semibold uppercase text-gray-500">{children}</h3>,
  p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-gray-400">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-gray-400">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-gray-400">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-gray-100">{children}</strong>,
  code: ({ children }) => <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-cyan-300">{children}</code>,
  hr: () => <hr className="my-6 border-line" />,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 rounded border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
      {children}
    </blockquote>
  ),
};

export function AjudaPage() {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-line bg-card p-6 md:p-8">
      <Markdown components={components}>{manualMarkdown}</Markdown>
    </div>
  );
}
