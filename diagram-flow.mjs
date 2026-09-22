// A gap is its own interval; it must never become a negative next-step progress.
export function getFlowFrame(steps, elapsed, gap) {
  let start = 0;
  for (let index = 0; index < steps.length; index++) {
    const end = start + steps[index].ms;
    if (elapsed >= start && elapsed < end) {
      return { index, progress: (elapsed - start) / steps[index].ms };
    }
    start = end + gap;
  }
  return { index: -1, progress: 0 };
}

export function findEndpointNode(nodes, x, y, tolerance = 8) {
  let hit = null;
  let best = Infinity;
  const connected = nodes.filter(node => !node.group);
  if (connected.length !== nodes.length) {
    const node = findEndpointNode(connected, x, y, tolerance);
    if (node) return node;
  }
  for (const node of nodes) {
    const dx = Math.max(node.x - x, 0, x - node.x - node.width);
    const dy = Math.max(node.y - y, 0, y - node.y - node.height);
    const distance = Math.hypot(dx, dy);
    if (distance > tolerance) continue;
    if (distance < best || (distance === best && node.width * node.height < hit.width * hit.height)) {
      best = distance;
      hit = node;
    }
  }
  return hit;
}

// Reserve the final fifth of each step for a visible arrival at the receiver.
export function getPacketState(stepProgress) {
  return { progress: Math.min(1, Math.max(0, stepProgress / .8)), arrived: stepProgress >= .8 };
}
