import { useEffect, useState } from "react";
import { COUNTRY_CODES } from "../countryCodes.js";

const DEFAULT_COUNTRY_CODE = "+91";

function parsePhone(value) {
  const str = (value || "").trim();
  const match = str.match(/^(\+\d{1,4})[\s-]*(.*)$/);
  if (match && COUNTRY_CODES.some((c) => c.dialCode === match[1])) {
    return { countryCode: match[1], number: match[2].trim() };
  }
  return { countryCode: DEFAULT_COUNTRY_CODE, number: str };
}

function combine(countryCode, number) {
  return number ? `${countryCode} ${number}` : "";
}

function PhoneInput({ id, value, onChange, placeholder }) {
  const [countryCode, setCountryCode] = useState(() => parsePhone(value).countryCode);
  const [number, setNumber] = useState(() => parsePhone(value).number);

  useEffect(() => {
    if (combine(countryCode, number) !== (value || "")) {
      const parsed = parsePhone(value);
      setCountryCode(parsed.countryCode);
      setNumber(parsed.number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="phone-input">
      <select
        className="phone-input-code"
        value={countryCode}
        onChange={(e) => {
          setCountryCode(e.target.value);
          onChange(combine(e.target.value, number));
        }}
        aria-label="Country code"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={`${c.dialCode}-${c.name}`} value={c.dialCode}>
            {c.dialCode} {c.name}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        className="phone-input-number"
        value={number}
        placeholder={placeholder}
        onChange={(e) => {
          setNumber(e.target.value);
          onChange(combine(countryCode, e.target.value));
        }}
      />
    </div>
  );
}

export default PhoneInput;
