import {Vector3} from 'three';

// These sites establish the main axis, perimeter and side precincts on a city map.
const mapLandmarks = ['taihe', 'wumen', 'shenwu', 'qianqing', 'donghua', 'xihua',
                      'yuhuayuan', 'cining', 'ningshou', 'wenhua', 'wuying'];

function fits(box, width, height, occupied) {
  return box.left >= 2 && box.top >= 2 && box.right <= width - 2 && box.bottom <= height - 2 &&
    occupied.every(r => box.right + 4 < r.left || box.left - 4 > r.right ||
                        box.bottom + 4 < r.top || box.top - 4 > r.bottom);
}

// Pick the closest projected centre. Overlapping 46px touch targets then remain
// usable without displacing their visible dots or blocking OrbitControls drags.
function bindPointPicking(canvas, layer, entries) {
  let gesture;
  let hovered;
  function nearest(event, radius) {
    if (layer.hidden) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    let best;
    for (const entry of entries) {
      if (entry.button.hidden) continue;
      const box = entry.nameBox;
      if (box && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return entry.button;
      const distance = Math.hypot(entry.x - x, entry.y - y);
      if (distance < radius) {
        best = entry.button;
        radius = distance;
      }
    }
    return best;
  }
  function hover(button) {
    if (hovered === button) return;
    hovered?.classList.remove('point-hover');
    button?.classList.add('point-hover');
    hovered = button;
  }
  canvas.addEventListener('pointerdown', e => {
    hover(null);
    gesture = e.isPrimary && e.button === 0 ? {id: e.pointerId, x: e.clientX, y: e.clientY} : null;
  });
  canvas.addEventListener('pointermove', e => {
    if (gesture && Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 6) gesture = null;
    if (e.pointerType === 'mouse' && !e.buttons) hover(nearest(e, 12));
  });
  canvas.addEventListener('pointerup', e => {
    if (gesture?.id === e.pointerId && Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) <= 6) {
      nearest(e, e.pointerType === 'mouse' ? 12 : 23)?.click();
    }
    gesture = null;
  });
  canvas.addEventListener('pointercancel', () => { gesture = null; });
  canvas.addEventListener('pointerleave', () => hover(null));
}

export function createMarkers(canvas, layer, places, visit) {
  const projected = new Vector3();
  const entries = [];
  const controls = [...document.querySelectorAll('header .brand, .header-tools, .explore-nav, .vantage, .zoom-controls, .bearing, footer, #panel')];
  places.forEach(place => {
    if (!place.anchor) return;
    const button = document.createElement('button');
    button.className = place.parentId ? 'marker feature-marker' : 'marker';
    button.setAttribute('aria-label', '查看' + place.name);
    button.innerHTML = `<span class="point"></span>
      <span class="roof-name" aria-hidden="true">${place.name}</span>
      <span class="marker-preview"><strong>${place.name}</strong></span>`;
    const preview = document.createElement('img');
    preview.alt = '';
    preview.loading = 'lazy';
    preview.src = place.photo?.src || './media/' + (place.parentId || place.id) + '.webp';
    button.lastElementChild.prepend(preview);
    button.onclick = () => visit(place);
    layer.append(button);
    const rank = mapLandmarks.indexOf(place.id);
    entries.push({button, name: button.querySelector('.roof-name'), pos: new Vector3(...place.anchor),
      priority: rank < 0 ? mapLandmarks.length : rank,
      feature: Boolean(place.parentId), length: Array.from(place.name).length});
  });
  entries.sort((a, b) => a.priority - b.priority);
  bindPointPicking(canvas, layer, entries);

  return function project(camera, names, orbitDistance) {
    const width = layer.clientWidth;
    const height = layer.clientHeight;
    const points = !layer.classList.contains('hide-points');
    const placed = names ? controls.map(el => el.getBoundingClientRect()) : [];
    const pixelScale = height * camera.projectionMatrix.elements[5] / 2;
    for (const entry of entries) {
      const {button, name, pos, length} = entry;
      entry.nameBox = null;
      // The south-facing relief and terrace are visible at courtyard scale.
      if (entry.feature && (camera.position.z < pos.z || camera.position.distanceToSquared(pos) > 220 ** 2 || orbitDistance > 300)) {
        button.hidden = true;
        continue;
      }
      projected.copy(pos).applyMatrix4(camera.matrixWorldInverse);
      const pixelsPerUnit = camera.isOrthographicCamera ? pixelScale : pixelScale / -projected.z;
      projected.applyMatrix4(camera.projectionMatrix);
      // A courtyard view labels its immediate surroundings. Pulling back expands
      // the labelled range until all mapped sites are included in the panorama.
      const distant = pos.distanceToSquared(camera.position) > (orbitDistance * 1.75) ** 2;
      button.hidden = distant || projected.z < -1 || projected.z > 1 ||
                      Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1;
      if (button.hidden) continue;
      const x = (1 + projected.x) * width / 2;
      const y = (1 - projected.y) * height / 2;
      // Scale the entire painted point (including its ring and shadow) like a
      // 2.8-unit object in the scene. The transparent hit area stays independent.
      const diameter = Math.max(1.25, Math.min(18, pixelsPerUnit * (entry.feature ? 2 : 2.8)));
      button.style.setProperty('--point-scale', (diameter / 13).toFixed(3));
      entry.x = x;
      entry.y = y;
      button.style.left = x + 'px';
      button.style.top = y + 'px';
      // Reveal minor sites only when there is room to read an individual courtyard.
      const eligible = entry.priority < mapLandmarks.length || (!camera.isOrthographicCamera && pixelsPerUnit >= 1.6);
      if (names && eligible) {
        const size = Math.min(20, Math.max(10, 11 * Math.sqrt(pixelsPerUnit)));
        const gap = Math.max(2, Math.min(9, diameter / 2 + 1));
        const box = {left: x - size * .65, right: x + size * .65, bottom: y - gap,
                     top: y - gap - size * 1.12 * length};
        if (fits(box, width, height, placed)) {
          entry.nameBox = box;
          placed.push(box);
          name.style.fontSize = size.toFixed(2) + 'px';
          name.style.bottom = 'calc(50% + ' + gap.toFixed(2) + 'px)';
        }
      }
      name.hidden = !entry.nameBox;
      button.hidden = !points && !entry.nameBox;
    }
  };
}
