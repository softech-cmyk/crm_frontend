import { useState } from "react";
import { X } from "lucide-react";
import "./ChipListInput.css";

function ChipListInput({ values, onChange, placeholder }) {
  const [input, setInput] = useState("");

  const add = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    onChange([...values, value]);
    setInput("");
  };

  const remove = (index) => onChange(values.filter((_, i) => i !== index));

  return (
    <div className="chip-list-input">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={add}
        placeholder={placeholder}
      />
      {values.length > 0 && (
        <ul className="chip-list">
          {values.map((value, index) => (
            <li key={`${value}-${index}`} className="chip-list-item">
              <span>{value}</span>
              <button type="button" onClick={() => remove(index)} aria-label={`Remove ${value}`}>
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
 
export default ChipListInput;
