export interface OceanBounds {
  width: number;
  height: number;
  cardLeft: number;
  cardRight: number;
  cardTop: number;
  cardBottom: number;
  cardRadius: number;
}

export function roundedCardContact(x: number, y: number, logoRadius: number, bounds: OceanBounds) {
  if (
    x + logoRadius < bounds.cardLeft ||
    x - logoRadius > bounds.cardRight ||
    y + logoRadius < bounds.cardTop ||
    y - logoRadius > bounds.cardBottom
  )
    return null;
  const radius = Math.min(
    bounds.cardRadius,
    (bounds.cardRight - bounds.cardLeft) / 2,
    (bounds.cardBottom - bounds.cardTop) / 2,
  );
  const nearestX = Math.max(bounds.cardLeft + radius, Math.min(x, bounds.cardRight - radius));
  const nearestY = Math.max(bounds.cardTop + radius, Math.min(y, bounds.cardBottom - radius));
  const dx = x - nearestX;
  const dy = y - nearestY;
  const distance = Math.hypot(dx, dy);
  const penetration = radius + logoRadius - distance;
  if (penetration <= 0) return null;
  if (distance > 0) return { normalX: dx / distance, normalY: dy / distance, penetration };

  // A layout resize can put a logo inside the card. Resolve toward the nearest face.
  const faces = [
    { normalX: -1, normalY: 0, penetration: x - bounds.cardLeft + logoRadius },
    { normalX: 1, normalY: 0, penetration: bounds.cardRight - x + logoRadius },
    { normalX: 0, normalY: -1, penetration: y - bounds.cardTop + logoRadius },
    { normalX: 0, normalY: 1, penetration: bounds.cardBottom - y + logoRadius },
  ];
  return faces.reduce((nearest, face) => (face.penetration < nearest.penetration ? face : nearest));
}

export interface SinkingLogo {
  x: number;
  y: number;
  originX: number;
  velocityY: number;
  drift: number;
  age: number;
  phase: number;
  speed: number;
  size: number;
  collided: boolean;
  bubbleIn: number;
}

export function createSinkingLogo(
  bounds: OceanBounds,
  random: () => number,
  initialY = -40,
): SinkingLogo {
  const size = 16;
  const originX = size + random() * Math.max(0, bounds.width - size * 2);
  const speed = 25 + random() * 16;
  return {
    x: originX,
    y: initialY,
    originX,
    velocityY: speed,
    drift: 0,
    age: 0,
    phase: random() * Math.PI * 2,
    speed,
    size,
    collided: false,
    bubbleIn: 0.5 + random() * 1.5,
  };
}

// The card triggers one bounce. It does not trap the logo on a solid surface.
export function stepSinkingLogo(
  logo: SinkingLogo,
  seconds: number,
  bounds: OceanBounds,
  random: () => number,
): boolean {
  const dt = Math.min(Math.max(seconds, 0), 1 / 30);
  const previousX = logo.x;
  logo.age += dt;
  logo.velocityY += (logo.speed - logo.velocityY) * (1 - Math.exp(-1.35 * dt));
  logo.y += logo.velocityY * dt;
  logo.originX += logo.drift * dt;
  logo.drift *= Math.exp(-1.5 * dt);
  logo.x = Math.min(
    bounds.width - logo.size / 2,
    Math.max(logo.size / 2, logo.originX + Math.sin(logo.age * 0.65 + logo.phase) * 14),
  );
  const contact = !logo.collided ? roundedCardContact(logo.x, logo.y, logo.size / 2, bounds) : null;
  if (!contact) return false;
  const velocityX = dt > 0 ? (logo.x - previousX) / dt : 0;
  const isApproaching = velocityX * contact.normalX + logo.velocityY * contact.normalY < 0;
  if (!isApproaching) return false;

  const impulse = 32 + random() * 30;
  const tangent = (random() - 0.5) * 42;
  logo.x += contact.normalX * contact.penetration;
  logo.originX += contact.normalX * contact.penetration;
  logo.y += contact.normalY * contact.penetration;
  logo.velocityY =
    contact.normalY * impulse +
    contact.normalX * tangent +
    logo.speed * (1 - Math.abs(contact.normalY));
  logo.drift = contact.normalX * impulse - contact.normalY * tangent;
  logo.collided = true;
  return true;
}
