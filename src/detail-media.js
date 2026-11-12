import {atlasPhotos} from './photos-atlas.js';
import {extraPhotos} from './photos-extra.js';

const photos = {...atlasPhotos, ...extraPhotos};

// Keep credits attached to the photograph when switching to the model view.
export function mountDetailMedia(container, record, site) {
  const photo = record.photo ?? photos[record.id];
  const model = site && {
    src: './media/' + site.id + '.webp',
    caption: site.id === record.id ? site.name + '的三维模型' : '区位参考 · ' + site.name + '的三维模型'
  };
  container.innerHTML = `<figure class="detail-figure">
    <div class="detail-image"><img alt=""><span></span></div>
    <figcaption><span class="image-description"></span> <a target="_blank" rel="noopener noreferrer"></a></figcaption>
    </figure>`;
  const figure = container.querySelector('figure');
  const img = figure.querySelector('img');
  const badge = figure.querySelector('.detail-image span');
  const caption = figure.querySelector('.image-description');
  const credit = figure.querySelector('a');
  const license = credit.cloneNode(false);
  credit.after(' ', license);
  const choices = [];
  const sources = [];
  if (photo?.src) sources.push({label: photo.kind ?? '实景照片', image: photo});
  if (model) sources.push({label: '模型视图', image: model});
  function select(index) {
    const {label, image} = sources[index];
    choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    badge.textContent = label;
    caption.textContent = image.caption;
    const reference = image.source ? image : photo && !photo.src ? photo : null;
    credit.hidden = !reference;
    if (reference) {
      credit.href = reference.source;
      credit.textContent = image.source ? image.credit || '照片出处' : '查看馆方图版';
    }
    license.hidden = !image.licenseUrl;
    if (image.licenseUrl) {
      license.href = image.licenseUrl;
      license.textContent = image.license || '图片许可';
    }
    img.hidden = false;
    img.alt = image.caption;
    img.onerror = () => {
      img.hidden = true;
      caption.textContent = image.caption + '（图像暂未载入）';
    };
    img.src = image.src;
  }
  if (sources.length > 1) {
    const switcher = document.createElement('div');
    switcher.className = 'image-switch';
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', '建筑图像');
    for (const {label} of sources) {
      const index = choices.length;
      const button = document.createElement('button');
      button.textContent = label;
      button.onclick = () => select(index);
      choices.push(button);
      switcher.append(button);
    }
    figure.after(switcher);
  }
  if (sources.length) select(0);
  else container.replaceChildren();
  if (photo?.officialSource) {
    const official = document.createElement('a');
    official.className = 'official-photo';
    official.href = photo.officialSource;
    official.target = '_blank';
    official.rel = 'noopener noreferrer';
    official.textContent = '查看' + record.name + '的馆方图版';
    container.append(official);
  }
}
