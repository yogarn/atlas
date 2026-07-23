export function toTitleCase(str: string | undefined): string | undefined {
  if (!str) return str;
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}
