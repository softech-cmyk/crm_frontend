function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== "");
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function renderLiteMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const blocks = [];
  let bulletBuffer = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {bulletBuffer.map((line, i) => (
          <li key={i}>{renderInline(line, `li-${blocks.length}-${i}`)}</li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  lines.forEach((line, index) => {
    const bulletMatch = line.match(/^\s*-\s+(.*)$/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
      return;
    }
    flushBullets();
    if (line.trim() === "") {
      blocks.push(<br key={`br-${index}`} />);
    } else {
      blocks.push(<div key={`line-${index}`}>{renderInline(line, `line-${index}`)}</div>);
    }
  });
  flushBullets();

  return blocks;
}
