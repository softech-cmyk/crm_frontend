import { useEffect, useRef, useState } from "react";
import "./SuggestInput.css";

/**
 * Text input that suggests previously saved records while typing.
 * - fetchSuggestions(query) -> Promise<item[]>
 * - getLabel(item) -> { title, subtitle }
 * - onPick(item) is called when a suggestion is clicked / chosen with Enter.
 * Other props are passed through to the <input>.
 */
function SuggestInput({ value, onChange, fetchSuggestions, getLabel, onPick, ...inputProps }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const skipNext = useRef(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = (value || "").trim();
    if (q.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      fetchSuggestions(q)
        .then((results) => {
          if (id !== requestId.current) return;
          setItems(results || []);
          setActive(-1);
          setOpen((results || []).length > 0);
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const pick = (item) => {
    skipNext.current = true;
    requestId.current++;
    setOpen(false);
    setItems([]);
    onPick(item);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="suggest-input">
      <input
        {...inputProps}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setOpen(false)}
        autoComplete="off"
      />
      {open && (
        <ul className="suggest-input-list" role="listbox">
          {items.map((item, index) => {
            const { title, subtitle } = getLabel(item);
            return (
              <li
                key={item._id || index}
                role="option"
                aria-selected={index === active}
                className={index === active ? "active" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(item);
                }}
              >
                <span className="suggest-input-title">{title}</span>
                {subtitle && <span className="suggest-input-sub">{subtitle}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SuggestInput;
