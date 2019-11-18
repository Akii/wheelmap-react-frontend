// todo: check callers
export function normalizeCoordinate(number: string) {
  const asFloat = parseFloat(number);
  return Math.round(asFloat * 10000) / 10000;
}

export function normalizeCoordinates([lat, lon]: [string, string]): [number, number] {
  return [normalizeCoordinate(lat), normalizeCoordinate(lon)];
}
