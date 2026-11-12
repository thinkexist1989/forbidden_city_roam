import assert from 'node:assert/strict';
import test from 'node:test';
import {PerspectiveCamera, Vector3} from 'three';
import {places} from '../src/content.js';
import {blendOverview, createOverviewCamera, fitOverview} from '../src/overview.js';

test('after rotation, the four gates stay in frame with north up and east right', () => {
  const map = createOverviewCamera();
  for (const [width, height] of [[1280, 800], [800, 1280], [375, 670], [844, 390]]) {
    const top = 75, bottom = 145;
    fitOverview(map, width, height, top, bottom);
    const project = name => new Vector3(...places.find(p => p.name === name).anchor).project(map);
    const north = project('神武门'), south = project('午门');
    assert.ok(north.y > south.y);
    assert.ok(Math.abs(north.x - south.x) < 0.001);
    assert.ok(project('西华门').x < project('东华门').x);
    for (const p of places.filter(p => p.anchor)) {
      const {x, y, z} = project(p.name);
      const py = (1 - y) * height / 2;
      assert.ok(Math.abs(x) < 1 && Math.abs(z) < 1 && py > top && py < height - bottom, p.name);
    }
  }
});

test('the camera flight joins both projections without moving the saved orbit', () => {
  const free = new PerspectiveCamera(46, 1.6, 1, 9500), moving = free.clone();
  const target = new Vector3(-180, 12, -2230);
  free.position.set(-128, 68, -2090);
  free.lookAt(target);
  free.updateMatrixWorld();
  const eye = free.position.clone(), map = createOverviewCamera();
  fitOverview(map, 1280, 800, 78, 125);
  const tower = new Vector3(-166, 38, -1884);
  for (const [t, expected] of [[0, free], [1, map]]) {
    blendOverview(moving, free, target, map, t);
    assert.ok(tower.clone().project(moving).distanceTo(tower.clone().project(expected)) < 1e-9);
  }
  blendOverview(moving, free, target, map, .5);
  assert.ok(moving.position.y > eye.y && moving.position.y < map.position.y);
  assert.ok(moving.projectionMatrix.determinant() !== 0);
  assert.deepEqual(free.position, eye);
});
