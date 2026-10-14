const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function threeDigitsToWords(num) {
  let result = "";
  if (num >= 100) {
    result += `${ONES[Math.floor(num / 100)]} Hundred `;
    num %= 100;
  }
  if (num >= 20) {
    result += `${TENS[Math.floor(num / 10)]} `;
    num %= 10;
  }
  if (num > 0) {
    result += `${ONES[num]} `;
  }
  return result.trim();
}

export function numberToIndianWords(amount) {
  const rupees = Math.round(Number(amount) || 0);
  if (rupees === 0) return "Zero";

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  const parts = [];
  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitsToWords(hundred));

  return parts.join(" ").trim();
}

export function amountInWords(amount) {
  return `${numberToIndianWords(amount)} Only`;
}
