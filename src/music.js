import {icon} from './icons.js';
import lyrics from './media/light-zs.lrc?raw';

const cues = lyrics.split(/\r?\n/).flatMap(line => {
  const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
  return match ? [{time: Number(match[1]) * 60 + Number(match[2]), text: match[3]}] : [];
});

export function initMusic() {
  const audio = document.querySelector('#soundtrack');
  const control = document.querySelector('.music-control');
  const button = document.querySelector('#music');
  const lyric = document.querySelector('#lyric');
  const unlockHint = document.querySelector('#music-unlock');

  function syncLyric() {
    let line = '前奏';
    for (const cue of cues) {
      if (cue.time > audio.currentTime) break;
      line = cue.text || '间奏';
    }
    if (audio.error) line = '音乐载入失败，轻点重试';
    if (lyric.textContent !== line) lyric.textContent = line;
  }

  function syncButton() {
    const playing = !audio.paused && !audio.error;
    button.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
    button.innerHTML = icon(playing ? 'pause' : 'music');
    button.classList.toggle('playing', playing);
  }

  function play() {
    if (audio.error) audio.load();
    audio.play().catch(error => {
      if (error.name === 'NotAllowedError' && !audio.error && audio.paused) unlockHint.hidden = false;
      syncButton();
      syncLyric();
    });
  }

  // A touch on the canvas can end without a click when OrbitControls captures the pointer.
  function unlock(event) {
    if (!control.contains(event.target) && audio.paused) play();
  }
  function stopUnlock() {
    unlockHint.hidden = true;
    document.removeEventListener('pointerup', unlock, true);
    document.removeEventListener('click', unlock, true);
  }
  if (audio.paused) {
    document.addEventListener('pointerup', unlock, true);
    document.addEventListener('click', unlock, true);
    audio.addEventListener('playing', stopUnlock, {once: true});
  }
  for (const event of ['play', 'pause', 'error']) audio.addEventListener(event, syncButton);
  for (const event of ['timeupdate', 'seeked', 'loadedmetadata', 'error']) {
    audio.addEventListener(event, syncLyric);
  }

  let touchStart = null;
  let longPress = false;
  control.addEventListener('pointerenter', event => {
    control.classList.toggle('mouse-hover', event.pointerType === 'mouse');
  });
  control.addEventListener('pointerleave', () => control.classList.remove('mouse-hover'));
  button.addEventListener('pointerdown', event => {
    longPress = false;
    touchStart = event.pointerType === 'touch' || event.pointerType === 'pen' ? performance.now() : null;
    if (touchStart !== null) control.classList.add('show-tip');
  });
  button.addEventListener('pointerup', () => {
    longPress = touchStart !== null && performance.now() - touchStart >= 450;
    touchStart = null;
  });
  button.addEventListener('pointercancel', () => { touchStart = null; });
  button.addEventListener('contextmenu', event => event.preventDefault());
  button.addEventListener('click', event => {
    if (event.detail && longPress) {
      longPress = false;
      return;
    }
    stopUnlock();
    if (audio.paused || audio.error) play();
    else audio.pause();
  });
  document.addEventListener('pointerdown', event => {
    if (!control.contains(event.target)) control.classList.remove('show-tip');
  }, true);
  syncButton();
  if (audio.paused) play();
}
