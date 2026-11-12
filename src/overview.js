import {OrthographicCamera} from 'three';

// GLB world coordinates. The moat and projections of the four gates fit inside
// these bounds. North (Shenwu Gate) points along the negative Z axis.
const bounds = {west: -620, east: 277, north: -2940, south: -1765};

export function createOverviewCamera() {
  const camera = new OrthographicCamera();
  const x = (bounds.west + bounds.east) / 2, z = (bounds.north + bounds.south) / 2;
  camera.position.set(x, 1450, z);
  camera.up.set(0, 0, -1);
  camera.lookAt(x, 0, z);
  camera.far = 9500;
  camera.updateMatrixWorld();
  return camera;
}

export function fitOverview(camera, width, height, topInset, bottomInset) {
  const scale = Math.max((bounds.east - bounds.west) / Math.max(1, width - 24),
                         (bounds.south - bounds.north) / Math.max(1, height - topInset - bottomInset));
  const centerY = (height + topInset - bottomInset) / 2;
  camera.left = -width * scale / 2;
  camera.right = -camera.left;
  camera.top = centerY * scale;
  camera.bottom = (centerY - height) * scale;
  camera.updateProjectionMatrix();
  return (width - (bounds.east - bounds.west) / scale) / 2;
}

// Match both projections at the orbit target so the switch to the flat plan
// neither jumps in scale nor clips the palace as the camera rises.
export function blendOverview(out, free, target, map, t) {
  const radius = free.position.distanceTo(target) * (1 - t) + map.position.y * t;
  out.quaternion.slerpQuaternions(free.quaternion, map.quaternion, t);
  out.position.set(0, 0, radius).applyQuaternion(out.quaternion);
  out.position.x += target.x * (1 - t) + map.position.x * t;
  out.position.y += target.y * (1 - t);
  out.position.z += target.z * (1 - t) + map.position.z * t;
  const a = free.projectionMatrix.elements, b = map.projectionMatrix.elements;
  const projection = out.projectionMatrix.elements;
  for (let i = 0; i < 16; i++) projection[i] = a[i] * (1 - t) / radius + b[i] * t;
  out.projectionMatrixInverse.copy(out.projectionMatrix).invert();
  out.updateMatrixWorld();
}
