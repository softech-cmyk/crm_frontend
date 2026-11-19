// Today's date as YYYY-MM-DD in the user's own time zone.
// (new Date().toISOString() is UTC and gives yesterday's date for part of the day in India.)
export function localDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
