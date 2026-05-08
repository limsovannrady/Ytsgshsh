interface Props { data: unknown; }

function highlight(json: string): string {
  return json
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span class="json-key">${match}</span>`;
          return `<span class="json-str">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span class="json-bool">${match}</span>`;
        if (/null/.test(match)) return `<span class="json-null">${match}</span>`;
        return `<span class="json-num">${match}</span>`;
      }
    );
}

export function JsonViewer({ data }: Props) {
  const text = JSON.stringify(data, null, 2);
  return (
    <div
      className="rounded-xl p-4 overflow-x-auto"
      style={{ background: "hsl(var(--json-bg))" }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
        <span className="h-3 w-3 rounded-full bg-green-500/80" />
        <span className="ml-2 text-xs text-white/30 font-mono">Response JSON</span>
      </div>
      <pre
        className="json-viewer text-white/90 whitespace-pre-wrap break-all"
        dangerouslySetInnerHTML={{ __html: highlight(text) }}
      />
    </div>
  );
}
