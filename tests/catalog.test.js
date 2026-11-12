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

test('detail markers reference a building and a distinct, sourced close-up', async () => {
  const {features} = await import('../src/features.js');
  const ids = new Set(byId.keys());
  for (const feature of features) {
    assert.ok(byId.get(feature.parentId)?.anchor && !ids.has(feature.id), feature.id);
    ids.add(feature.id);
    assert.ok(isVector(feature.anchor) && isVector(feature.offset), feature.id);
    assert.ok(feature.form && feature.use && feature.sources.length, feature.id);
    assert.ok(feature.photo.caption && feature.photo.source && feature.photo.src, feature.id);
  }
});

test('photographs use existing archive IDs, record provenance and ship valid local assets', async () => {
  const {atlasPhotos} = await import('../src/photos-atlas.js');
  const {extraPhotos} = await import('../src/photos-extra.js');
  const records = [...Object.entries(atlasPhotos), ...Object.entries(extraPhotos)];
  assert.equal(new Set(records.map(([id]) => id)).size, records.length);
  for (const [id, photo] of records) {
    assert.ok(byId.has(id) && photo.source && photo.caption && photo.credit, id);
    if (photo.src?.startsWith('./photos/')) {
      const file = readFileSync(new URL('../public/' + photo.src, import.meta.url));
      const valid = file.toString('ascii', 8, 12) === 'WEBP' || file.readUInt16BE(0) === 0xffd8 ||
                    file.readUInt32BE(0) === 0x89504e47;
      assert.ok(valid, id);
    }
  }
});
