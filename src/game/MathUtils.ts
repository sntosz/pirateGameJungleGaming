export interface Point {
  x: number;
  y: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Polygon {
  points: Point[];
}

export function distance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

export function circleCircleCollision(c1: Circle, c2: Circle): boolean {
  const d = distance(c1, c2);
  return d < c1.radius + c2.radius;
}

export function circlePolygonCollision(circle: Circle, polygon: Polygon): boolean {
  const pts = polygon.points;
  const numPts = pts.length;

  if (isPointInPolygon({ x: circle.x, y: circle.y }, polygon)) {
    return true;
  }

  for (let i = 0; i < numPts; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % numPts];
    if (distToSegment({ x: circle.x, y: circle.y }, p1, p2) < circle.radius) {
      return true;
    }
  }

  return false;
}

export function isPointInPolygon(p: Point, polygon: Polygon): boolean {
  const pts = polygon.points;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y;
    const xj = pts[j].x, yj = pts[j].y;

    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return distance(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt(
    (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2
  );
}
