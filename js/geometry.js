export function isAligned(rectA, rectB, tolerance = 6) {
  const centerA = { x: (rectA.left + rectA.right) / 2, y: (rectA.top + rectA.bottom) / 2 };
  const centerB = { x: (rectB.left + rectB.right) / 2, y: (rectB.top + rectB.bottom) / 2 };
  return (
    Math.abs(centerA.x - centerB.x) <= tolerance &&
    Math.abs(centerA.y - centerB.y) <= tolerance
  );
}
