export const ALLOWED_PROPERTIES = new Set([
  'display',
  'flexDirection',
  'flexWrap',
  'flexFlow',
  'justifyContent',
  'alignItems',
  'alignContent',
  'alignSelf',
  'order',
  'gap',
  'rowGap',
  'columnGap',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
]);

function toCamelCase(prop) {
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function parseDeclarations(text) {
  const result = {};
  if (!text) return result;

  const lines = text.split(/[;\n]/);
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex < 1) continue;

    const rawProp = line.slice(0, colonIndex).trim().toLowerCase();
    const rawValue = line.slice(colonIndex + 1).trim();
    if (!rawProp || !rawValue) continue;

    const prop = toCamelCase(rawProp);
    if (!ALLOWED_PROPERTIES.has(prop)) continue;

    result[prop] = prop === 'order' ? (parseInt(rawValue, 10) || 0) : rawValue;
  }
  return result;
}
