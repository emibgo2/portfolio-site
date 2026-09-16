const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const SCATTER_SEEDS = [
  [-4.15, 1.82, .42], [-2.35, 2.54, -.20], [-.72, 1.58, .16],
  [1.05, 2.22, -.42], [2.82, 1.42, .48], [4.16, 2.46, -.16],
  [-3.78, .18, .38], [-1.72, .55, -.22], [.08, .12, .44], [1.92, .62, -.34],
  [3.78, .08, .26], [-3.94, -1.62, .30], [-1.92, -1.08, -.46], [.34, -1.82, .10]
];

export function createScatterLayout(count) {
  return Array.from({ length: count }, (_, index) => {
    const seed = SCATTER_SEEDS[index % SCATTER_SEEDS.length];
    const cycle = Math.floor(index / SCATTER_SEEDS.length);
    return {
      x: seed[0] + cycle * .12,
      y: seed[1] - cycle * .08,
      z: seed[2],
      layer: index % 3
    };
  });
}

export function getLoopedX(startX, elapsedMs, {
  speed = 0.2,
  left = -7.8,
  right = 7.8
} = {}) {
  const span = right - left;
  if (span <= 0) return left;

  const travelledX = startX - (Math.max(0, elapsedMs) / 1000) * speed;
  return ((travelledX - left) % span + span) % span + left;
}

export function projectScatterNode(node, {
  width,
  height,
  centerX,
  centerY,
  rotation = 0,
  tilt = 0.18
}) {
  const cosRotation = Math.cos(rotation);
  const sinRotation = Math.sin(rotation);
  const rotatedX = node.x * cosRotation - node.z * sinRotation;
  const rotatedZ = node.x * sinRotation + node.z * cosRotation;
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);
  const projectedY = node.y * cosTilt - rotatedZ * sinTilt;
  const depthValue = node.y * sinTilt + rotatedZ * cosTilt;
  const depth = clamp((depthValue + 2.6) / 5.2, 0, 1);
  const perspective = 0.84 + depth * 0.28;
  const worldScale = Math.min(width * 0.16, height * 0.28);

  return {
    x: centerX + rotatedX * worldScale * perspective,
    y: centerY + projectedY * worldScale * perspective,
    z: depthValue,
    depth,
    scale: perspective
  };
}

export function getQualityProfile(width, height, devicePixelRatio = 1) {
  const mobile = width < 760 || height < 520;

  return {
    mobile,
    pixelRatio: mobile ? 1 : Math.min(1.5, Math.max(1, devicePixelRatio)),
    nodeCount: mobile ? 10 : 14,
    curveSegments: mobile ? 10 : 16,
    logoDepth: 5.8,
    logoScale: 0.7,
    layoutSpread: mobile ? 1.08 : 1.24,
    frontOpacity: .96,
    haloOpacity: .24
  };
}
