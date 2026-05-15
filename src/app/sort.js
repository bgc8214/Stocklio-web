export function parseSortValue(value, fallback) {
  const [key, dir] = String(value || fallback).split("-");
  return { key, dir: dir === "asc" ? "asc" : "desc" };
}

export function cycleSortValue(currentValue, key, fallback) {
  const current = parseSortValue(currentValue, fallback);
  if (current.key !== key) {
    return `${key}-asc`;
  }
  if (current.dir === "asc") {
    return `${key}-desc`;
  }
  return fallback;
}
