// A deliberately tiny markdown renderer for AI output: headings, bullets,
// numbered lists and **bold**. Builds React elements rather than injecting
// HTML, so model output can never become markup.

const inline = (text, keyBase) => {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.filter(Boolean).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyBase}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={`${keyBase}-${i}`} className="md-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={`${keyBase}-${i}`}>{part}</span>;
  });
};

export default function Markdown({ children }) {
  const lines = String(children || "").split("\n");
  const blocks = [];
  let list = null;

  const flush = () => {
    if (list) {
      blocks.push(
        <ul className="md-list" key={`ul-${blocks.length}`}>
          {list.map((item, i) => (
            <li key={i}>{inline(item, `li-${blocks.length}-${i}`)}</li>
          ))}
        </ul>
      );
      list = null;
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();

    if (!line) {
      flush();
      return;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+\.\s+(.*)$/);

    if (bullet || numbered) {
      list = list || [];
      list.push((bullet || numbered)[1]);
      return;
    }

    flush();

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      blocks.push(
        <div className="md-h" key={`h-${idx}`}>
          {inline(heading[2], `h-${idx}`)}
        </div>
      );
      return;
    }

    blocks.push(
      <p className="md-p" key={`p-${idx}`}>
        {inline(line, `p-${idx}`)}
      </p>
    );
  });

  flush();

  return <div className="md">{blocks}</div>;
}
