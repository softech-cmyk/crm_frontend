import { useEffect, useRef, useState } from "react";
import "./SuggestInput.css";

/**
 * Text input that suggests previously saved records while typing.
 * - fetchSuggestions(query) -> Promise<item[]>
 * - getLabel(item) -> { title, subtitle }
 * - onPick(item) is called when a suggestion is clicked / chosen with Enter.
 * Other props are passed through to the <input>.
 *
 * Suggestions are only fetched while this input is focused, so a pick that fills
 * *other* fields (or this one) never opens a stray dropdown.
 */
function SuggestInput({ value, onChange, fetchSuggestions, getLabel, onPick, ...inputProps }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const focused = useRef(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!focused.current) return;
    const q = (value || "").trim();
    if (q.length < 2) {
      requestId.current++;
      setItems([]);
      setOpen(false);
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      fetchSuggestions(q)
        .then((results) => {
          // Ignore stale responses and ones that arrive after the field lost focus.
          if (id !== requestId.current || !focused.current) return;
          setItems(results || []);
          setActive(-1);
          setOpen((results || []).length > 0);
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const close = () => {
    requestId.current++;
    setOpen(false);
    setItems([]);
    setActive(-1);
  };

  const pick = (item) => {
    close();
    onPick(item);
    // Leave the field so the value change caused by the pick doesn't search again.
    focused.current = false;
    inputRef.current?.blur();
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
      close();
    }
  };

  return (
    <div className="suggest-input">
      <input
        {...inputProps}
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          close();
        }}
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
