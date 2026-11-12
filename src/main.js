import {places, timeline} from './content.js';
import {mountDetailMedia} from './detail-media.js';
import {features} from './features.js';
import {icon} from './icons.js';
import {createMarkers} from './markers.js';
import {initMusic} from './music.js';
import {createScene} from './scene.js';

const $ = q => document.querySelector(q);
const app = $('#app');
const panel = $('#panel');
const body = $('#panel-body');
const markerLayer = $('#markers');
const vantage = $('.vantage');
const projectMarkers = createMarkers($('#world'), markerLayer, [...features, ...places], record => {
  if (record.parentId) visitFeature(record, true);
  else visit(places.indexOf(record), true);
});
const placesById = new Map(places.map(place => [place.id, place]));
document.querySelectorAll('[data-icon]').forEach(el => {
  el.innerHTML = icon(el.dataset.icon);
});
initMusic();

let scene;
let exploring = false;
let failed = false;
let pendingEntry = false;
let labels = true;
let names = false;
let currentPanel = '';
let inOverview = false;
let focusReturn;
let noticeTimer;
function notice(text) {
  clearTimeout(noticeTimer);
  $('#notice').textContent = text;
  $('#notice').hidden = false;
  noticeTimer = setTimeout(() => {
    $('#notice').hidden = true;
  }, 3200);
}
function updateView(camera, angle, distance, moving) {
  $('.needle').style.transform = 'rotate(' + angle + 'rad)';
  app.classList.toggle('map-moving', moving);
  if (exploring) {
    markerLayer.hidden = moving || !(labels || names);
    $('.zoom-controls').hidden = moving || inOverview;
  }
  if (exploring && !markerLayer.hidden) projectMarkers(camera, names, distance);
}
function showCaption(place) {
  $('#view-name').textContent = place.name;
  $('#view-en').textContent = place.en;
  vantage.hidden = false;
}
function hideCaption() {
  if (!vantage.hidden) vantage.hidden = true;
}
function setPanelKey(key) {
  currentPanel = key;
  for (const id of ['index', 'history', 'map-info']) {
    $('#' + id).setAttribute('aria-expanded', String(id === key));
  }
}
function closePanel(restore = true) {
  if (panel.hidden)
    return;
  panel.hidden = true;
  app.classList.remove('panel-open');
  scene?.refresh();
  setPanelKey('');
  if (restore)
    (focusReturn?.isConnected && focusReturn.offsetWidth ? focusReturn : $('#index')).focus({
      preventScroll: true
    });
}
function openPanel(key, title, html) {
  if (panel.hidden)
    focusReturn = document.activeElement;
  setPanelKey(key);
  panel.hidden = false;
  app.classList.add('panel-open');
  $('#panel-title').textContent = title;
  $('#panel-title').classList.toggle('place-name', key === 'place' || key === 'feature');
  body.innerHTML = html;
  body.scrollTop = 0;
  $('#panel-title').focus({preventScroll: true});
  scene?.refresh();
}
function enter() {
  if (exploring)
    return;
  if (!scene && !failed) {
    pendingEntry = true;
    $('#loading').textContent = '载入后将直接进入漫游';
    return;
  }
  closePanel(false);
  exploring = true;
  scene?.enter();
  app.classList.replace('intro', 'exploring');
  $('.opening').hidden = true;
  $('.explore-nav').hidden = false;
  markerLayer.hidden = !scene;
  $('.zoom-controls').hidden = !scene;
  for (const id of ['overview', 'labels', 'names']) $('#' + id).disabled = !scene;
  scene?.refresh();
  $('#index').focus({preventScroll: true});
  if (failed)
    showIndex();
}
function visit(index, fromMarker = false) {
  const p = places[index];
  closePanel(false);
  hideCaption();
  if (inOverview) toggleOverview();
  const site = p.anchor ? p : placesById.get(p.nearby);
  const show = () => {
    if (fromMarker && scene) showCaption(site);
    const nearby = places.flatMap((other, i) => other.nearby === p.id ?
      [`<button data-visit="${i}">${other.name}</button>`] : []);
    const details = features.filter(feature => feature.parentId === p.id);
    openPanel(
        'place', p.name,
        `
      <div class="detail-media"></div>
      <p class="en-name" lang="en">${p.en}</p>
      ${details.length ? `<h3>看建筑细部</h3><div class="feature-links">${details.map(f =>
        `<button data-feature="${f.id}">${f.name} ${icon('right')}</button>`).join('')}</div>` : ''}
      ${p.siteNote ? `<p class="site-note">${p.siteNote}</p>` : ''}
      <h3>建筑形制</h3><p>${p.form}</p><h3>宫廷功能</h3><p>${p.use}</p>
      <div class="historical"><time>${p.year}</time><h3>${p.person}</h3><p>${p.story}</p></div>
      <div class="sources">史料出处　${
            p.sources
                .map(
                    ([name, url]) =>
                        `<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`)
                .join('　')}</div>
      ${nearby.length ? `<h3>附近建筑档案</h3><div class="related-places">${nearby.join('')}</div>` : ''}
      <div class="detail-nav"><button data-list>返回图录</button><button data-visit="${
            (index + 1) % places.length}">前往<span class="place-name">${places[(index + 1) % places.length].name}</span> ${
            icon('right')}</button></div>`);
    mountDetailMedia(body.querySelector('.detail-media'), p, site);
  };
  if (scene && !failed)
    scene.focus(site, show);
  else
    show();
}
function visitFeature(feature, fromMarker = false) {
  const parent = placesById.get(feature.parentId);
  closePanel(false);
  hideCaption();
  if (inOverview) toggleOverview();
  const show = () => {
    if (fromMarker && scene) showCaption(feature);
    openPanel('feature', feature.name, `
      <div class="detail-media"></div>
      <p class="en-name" lang="en">${feature.en}</p>
      <h3>看哪里</h3><p>${feature.form}</p>
      <h3>为什么这样建</h3><p>${feature.use}</p>
      <div class="sources">史料出处　${feature.sources.map(([title, url]) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`).join('　')}</div>
      <div class="detail-nav"><button data-visit="${places.indexOf(parent)}">返回<span class="place-name">${parent.name}</span></button><button data-list>建筑图录</button></div>`);
    mountDetailMedia(body.querySelector('.detail-media'), feature);
  };
  if (scene && !failed) scene.focus(feature, show);
  else show();
}
function showIndex() {
  openPanel('index', '建筑图录', `
    <label class="catalog-search"><span>查找建筑</span><input type="search" placeholder="输入建筑名称或宫区" autocomplete="off"></label>
    <div class="catalog" id="catalog-results"></div>`);
  const input = body.querySelector('input');
  const results = body.querySelector('#catalog-results');
  function filter() {
    const query = input.value.trim().toLowerCase();
    const rows = [];
    places.forEach((p, i) => {
      if (![p.name, p.type, p.en].some(text => text.toLowerCase().includes(query))) return;
      const imageId = p.anchor ? p.id : p.nearby;
      rows.push(`<button data-visit="${i}"><img loading="lazy" src="./media/${imageId}.webp" alt="">
        <span><strong>${p.name}</strong><small>${p.type}${p.anchor ? '' : ' · 区位参考'}</small></span>${icon('right')}</button>`);
    });
    results.innerHTML = rows.length ? rows.join('') : '<p>没有找到匹配的建筑。</p>';
  }
  input.addEventListener('input', filter);
  filter();
}
function showHistory() {
  openPanel(
      'history', '历史年表',
      `<p class="panel-intro">从永乐营建到紫禁城建成六百年。</p><div class="timeline">${
          timeline
              .map(
                  ([year, era, title, description, id]) => `
    <article><div class="era"><time>${year}</time><span>${era}</span></div><h3>${title}</h3><p>${
                      description}</p>${
                      id ? `<button data-visit="${places.findIndex(p => p.id === id)}">查看<span class="place-name">${
                               placesById.get(id).name}</span> ${icon('right')}</button>` :
                           ''}</article>`)
              .join('')}</div>
    <div class="sources"><a href="https://www.dpm.org.cn/subject_600/" target="_blank" rel="noopener noreferrer">故宫博物院 · 六百年专题</a></div>`);
}
function showHelp() {
  openPanel(
      'help', '操作指南',
      `<h3>触控漫游</h3><p>单指拖动环绕建筑，双指捏合缩放，双指同向移动平移画面。轻点金色光点打开建筑档案。靠近太和殿南侧，点朱红色圆点可细看台基和御路石，也可从太和殿档案的「看建筑细部」进入。</p>
    <h3>鼠标浏览</h3><p>按住左键旋转，滚轮缩放，按住右键平移。将指针移到光点上预览建筑，点击进入详情。</p>
    <h3>找到方向</h3><p>点叠层图标切换到上北下南的宫城鸟瞰，再点一次回到原视角。鸟瞰中点建筑也可直接前往。点定位图标开关光点，点「字」图标开关竖排建筑名。远处只标主要建筑，拉近后可看院落里的名称。也可从「建筑图录」查找，或从「历史年表」回到现场。</p>
    <h3>背景音乐</h3><p>轻点右上角音符或暂停图标可切换播放。鼠标悬停或在平板上长按图标可查看同步歌词，轻点画面收起。</p>
    <h3>键盘操作</h3><p>使用 Tab 切换控件，Enter 激活，Esc 关闭面板。</p>`);
}
function togglePanel(key, render) {
  if (exploring)
    scene?.cancel();
  if (currentPanel === key)
    closePanel();
  else
    render();
}
$('#help').onclick = () => togglePanel('help', showHelp);
$('#index').onclick = () => togglePanel('index', showIndex);
$('#history').onclick = () => togglePanel('history', showHistory);
$('#map-info').onclick = () => togglePanel('map-info', () =>
  openPanel('map-info', '宫城概览', $('.map-facts').innerHTML));
$('#close').onclick = () => closePanel();
$('#enter').onclick = enter;
$('#full').onclick = async () => {
  try {
    if (document.fullscreenElement)
      await document.exitFullscreen();
    else
      await app.requestFullscreen();
  } catch {
    notice('此浏览器暂时无法进入全屏');
  }
};
document.addEventListener('fullscreenchange', () => {
  const active = Boolean(document.fullscreenElement);
  $('#full').innerHTML = icon(active ? 'exit' : 'expand');
  $('#full').title = active ? '退出全屏' : '进入全屏';
  $('#full').setAttribute('aria-label', $('#full').title);
});
function syncLayers() {
  markerLayer.hidden = !scene || app.classList.contains('map-moving') || !(labels || names);
  markerLayer.classList.toggle('hide-points', !labels);
  markerLayer.classList.toggle('show-names', names);
  $('#labels').setAttribute('aria-pressed', String(labels));
  $('#names').setAttribute('aria-pressed', String(names));
  scene?.refresh();
}
$('#labels').onclick = () => {
  labels = !labels;
  syncLayers();
};
$('#names').onclick = () => {
  names = !names;
  syncLayers();
};
function toggleOverview() {
  closePanel(false);
  hideCaption();
  inOverview = !inOverview;
  app.classList.add('map-moving');
  markerLayer.hidden = true;
  app.classList.toggle('map-view', inOverview);
  $('.zoom-controls').hidden = true;
  $('#overview').setAttribute('aria-pressed', String(inOverview));
  $('#overview').title = inOverview ? '退出全景，返回自由浏览' : '正北朝上查看全景';
  scene.overview(inOverview);
}
$('#overview').onclick = toggleOverview;
$('#zoom-in').onclick = () => scene?.zoom(.76);
$('#zoom-out').onclick = () => scene?.zoom(1.32);
body.onclick = e => {
  const dest = e.target.closest('[data-visit]');
  const detail = e.target.closest('[data-feature]');
  if (dest)
    visit(Number(dest.dataset.visit));
  else if (detail)
    visitFeature(features.find(f => f.id === detail.dataset.feature));
  else if (e.target.closest('[data-list]'))
    showIndex();
};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape')
    closePanel();
});

function fail(message) {
  failed = true;
  scene = undefined;
  hideCaption();
  if (inOverview) {
    inOverview = false;
    app.classList.remove('map-view');
    $('#overview').setAttribute('aria-pressed', 'false');
  }
  app.classList.remove('ready');
  markerLayer.hidden = true;
  $('.zoom-controls').hidden = true;
  $('#overview').disabled = $('#labels').disabled = $('#names').disabled = true;
  $('#loading').replaceChildren(document.createTextNode(message + ' '));
  const retry = document.createElement('button');
  retry.textContent = '重新载入';
  retry.onclick = () => location.reload();
  $('#loading').append(retry);
  $('#enter span').textContent = '浏览建筑图录';
  if (exploring) {
    showIndex();
    body.insertAdjacentHTML(
        'afterbegin', '<p>三维画面已中断。<button id="retry">重新载入</button></p>');
    $('#retry').onclick = () => location.reload();
  } else if (pendingEntry)
    enter();
}
createScene(
    $('#world'), updateView,
    (done, total) => {
      if (!pendingEntry)
        $('#loading').textContent = `正在载入宫城　${done} / ${total}`;
    },
    fail, () => ({
      top: Math.ceil($('header').getBoundingClientRect().bottom) + 8,
      bottom: app.clientHeight - $('.explore-nav').getBoundingClientRect().top + 8
    }), hideCaption)
    .then(result => {
      scene = result;
      app.classList.add('ready');
      $('#loading').textContent = '';
      if (pendingEntry)
        enter();
      else
        scene.intro();
    })
    .catch(error => {
      console.error('宫城场景载入失败', error);
      fail('三维场景未能载入。');
    });
