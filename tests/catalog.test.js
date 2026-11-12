import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {places, timeline} from '../src/content.js';

const byId = new Map(places.map(place => [place.id, place]));
const isVector = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);

test('each distinct archive has a documented history and source', () => {
  assert.equal(byId.size, places.length);
  assert.equal(new Set(places.map(p => p.name)).size, places.length);
  for (const place of places) {
    for (const key of ['name', 'en', 'type', 'form', 'use', 'year', 'person', 'story']) {
      assert.ok(String(place[key] ?? '').trim(), place.id + ' missing ' + key);
    }
    assert.ok(place.sources.length > 0, place.id);
    for (const [title, url] of place.sources) {
      assert.ok(title && ['http:', 'https:'].includes(new URL(url).protocol), place.id);
    }
  }
});

test('every archive leads to a real camera view and WebP preview', () => {
  for (const place of places) {
    const site = place.anchor ? place : byId.get(place.nearby);
    assert.ok(site && isVector(site.anchor) && isVector(site.offset), place.id);
    if (!place.anchor) assert.ok(place.siteNote?.trim(), place.id);
    const image = new URL('../public/media/' + site.id + '.webp', import.meta.url);
    assert.equal(readFileSync(image).toString('ascii', 8, 12), 'WEBP', place.id);
  }
});

test('timeline destinations exist and events are chronological', () => {
  let last = 0;
  for (const [year, era, title, description, id] of timeline) {
    assert.ok(Number.isFinite(year) && year >= last, title);
    assert.ok(era && title && description);
    if (id) assert.ok(byId.has(id), id);
    last = year;
  }
});
