import {Vector3} from 'three';

// Check offsets in distance order so the closest available slot wins. Dense
// palace courtyards can use the side margins without moving the roof anchor.
const offsets = [];
for (let col = -8; col <= 8; col++) {
  for (let row = -3; row <= 3; row++) {
    const dx = col * 32, dy = row * 26;
    offsets.push({dx, dy, distance: Math.hypot(dx, dy)});
  }
}
offsets.sort((a, b) => a.distance - b.distance);

function layoutSlot(x, y, top, width, height, halfWidth, below, placed) {
  let best;
  let bestCost = Infinity;
  for (const {dx, dy} of offsets) {
    const cx = Math.max(halfWidth, Math.min(width - halfWidth, x + dx));
    const cy = Math.max(top, Math.min(height - below, y + dy));
    const box = {left: cx - halfWidth, right: cx + halfWidth, top: cy - top, bottom: cy + below};
    const distance = Math.hypot(x - cx, y - cy);
    let overlap = 0;
    for (const other of placed) {
      const w = Math.min(box.right, other.right) - Math.max(box.left, other.left);
      const h = Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top);
      if (w > 0 && h > 0) overlap += w * h;
    }
    if (!overlap) return {cx, cy, box};
    const cost = overlap + distance;
    if (cost < bestCost) {
      best = {cx, cy, box};
      bestCost = cost;
    }
  }
  return best;
}

export function createMarkers(layer, places, visit) {
  const projected = new Vector3();
  const entries = [];
  const controls = [...document.querySelectorAll('header .brand, .header-tools, .explore-nav, .vantage, .zoom-controls')];
  places.forEach((place, index) => {
    if (!place.anchor) return;
    const button = document.createElement('button');
    button.className = 'marker';
    button.setAttribute('aria-label', '查看' + place.name);
    button.innerHTML = `<span class="leader" hidden></span><span class="point"></span>
      <span class="roof-name" aria-hidden="true">${place.name}</span>
      <span class="marker-preview"><img loading="lazy" src="./media/${place.id}.webp" alt=""><strong>${place.name}</strong></span>`;
    button.onclick = () => visit(index);
    layer.append(button);
    entries.push({button, leader: button.firstElementChild, pos: new Vector3(...place.anchor),
      length: Array.from(place.name).length});
  });

  return function project(camera, names, orbitDistance) {
    const width = layer.clientWidth;
    const height = layer.clientHeight;
    const placed = controls.map(el => el.getBoundingClientRect());
    const nameSize = Math.max(15, Math.min(19, width * .016));
    for (const entry of entries) {
      const {button, leader, pos, length} = entry;
      projected.copy(pos).project(camera);
      // A courtyard view labels its immediate surroundings. Pulling back expands
      // the labelled range until all mapped sites are included in the panorama.
      const distant = pos.distanceToSquared(camera.position) > (orbitDistance * 1.75) ** 2;
      button.hidden = distant || projected.z < -1 || projected.z > 1 ||
                      Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1;
      if (button.hidden) continue;
      const x = (1 + projected.x) * width / 2;
      const y = (1 - projected.y) * height / 2;
      const top = names ? Math.ceil(length * nameSize * 1.05) + 12 : 23;
      const {cx, cy, box} = layoutSlot(x, y, top, width, height, names ? 15 : 23, names ? 6 : 23, placed);
      placed.push(box);
      button.style.left = cx + 'px';
      button.style.top = cy + 'px';
      const distance = Math.hypot(x - cx, y - cy);
      leader.hidden = distance < 3;
      if (!leader.hidden) {
        leader.style.width = distance + 'px';
        leader.style.transform = 'rotate(' + Math.atan2(y - cy, x - cx) + 'rad)';
      }
    }
  };
}
