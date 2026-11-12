import {gardenArchives} from './places-garden.js';
import {specialPlaces} from './places-special.js';
import {outerPlaces} from './places-outer.js';
import {wingPlaces} from './places-wings.js';
import {innerPlaces} from './places-inner.js';

const buildingPage = code => 'https://www.dpm.org.cn/explore/building/' + code + '.html';

const outerAxis = [
  {
    id: 'wumen',
    name: '午门',
    en: 'Meridian Gate',
    type: '宫城正门',
    anchor: [-166, 38, -1884],
    offset: [105, 64, 142],
    form: '从南面看，正楼居中，两翼的城台向前伸出，形成围合的门前空间。它是紫禁城的正南门。',
    use: '朝廷在午门举行颁历、献俘等仪式。沿中轴线入宫，穿过这里，才进入外朝的礼仪空间。',
    year: '2020',
    person: '从宫门到展厅',
    story:
        '紫禁城建成六百周年时，故宫博物院在午门展厅举办“丹宸永固”展览。这座昔日的宫门，成为公众阅读宫城历史的地方。',
    sources: [
      ['午门形制', 'https://www.dpm.org.cn/building/talk/223745.html'],
      ['六百年专题展', 'https://www.dpm.org.cn/show/253730.html']
    ]
  },
  {
    id: 'taihemen',
    name: '太和门',
    en: 'Gate of Supreme Harmony',
    type: '外朝宫门',
    anchor: [-166, 29, -2057],
    offset: [78, 49, 98],
    form: '太和门横列在内金水桥以北。越过门楼，北侧开阔的庭院将视线引向太和殿。',
    use: '这里是外朝的重要门户。明代皇帝曾在此御门听政，官员上奏，皇帝听取并处理政务。',
    year: '1644',
    person: '顺治帝颁大赦令',
    story: '顺治帝福临在这座门颁发大赦令。当时它仍沿用明代的名字“皇极门”，次年才改称“太和门”。',
    sources: [['太和门', buildingPage(236439)]]
  },
  {
    id: 'taihe',
    name: '太和殿',
    en: 'Hall of Supreme Harmony',
    type: '外朝三大殿',
    anchor: [-166, 41, -2265],
    // Frame the roof, the three terraces and the foot of the imperial ramp together.
    target: [-160, 10, -2228],
    offset: [45, 62, 133],
    form: '沿石阶望去，三层汉白玉台基托起重檐庑殿顶。殿前开阔的广场为朝列和仪仗留出了空间。',
    use: '太和殿承担国家大典。明清皇帝在此举行登极等仪式，在元旦、冬至、万寿节接受朝贺。',
    year: '1667',
    person: '康熙帝亲政',
    story:
        '康熙六年，康熙帝在太和殿举行亲政大典，同日赴乾清门听政。一次行程连接了举行典礼与处理政务的两处空间。',
    sources: [
      ['太和殿', buildingPage(236465)],
      ['《故宫博物院院刊》', 'https://www.dpm.org.cn/journal/251996.html']
    ]
  },
  {
    id: 'zhonghe',
    name: '中和殿',
    en: 'Hall of Central Harmony',
    type: '外朝三大殿',
    anchor: [-166, 30, -2324],
    offset: [55, 40, 57],
    form: '中和殿夹在太和殿与保和殿之间。方形殿身上，四面屋坡向中央的宝顶聚拢，是辨认这座殿的线索。',
    use: '皇帝赴太和殿参加大典前，在此休息并接受执事官员行礼。亲耕礼之前，还要在这里查验种子和农具。',
    year: '1645',
    person: '中极殿改名',
    story: '这座殿明初名为华盖殿，后来改为中极殿。清顺治二年改称中和殿，延续至今。',
    sources: [['中和殿', buildingPage(236464)]]
  },
  {
    id: 'baohe',
    name: '保和殿',
    en: 'Hall of Preserving Harmony',
    type: '外朝三大殿',
    anchor: [-166, 35, -2378],
    offset: [67, 46, 84],
    form: '沿三层台基向北，保和殿位于三大殿的最北端。它采用重檐歇山顶，屋顶轮廓有别于南端的太和殿。',
    use: '清代这里曾举行宫廷筵宴，也见证了科举最高一级考试。考生奉策作答，皇帝钦定名次。',
    year: '1789',
    person: '乾隆朝定殿试之所',
    story: '乾隆五十四年起，殿试定在保和殿。考试之后，宣布名次的传胪典礼仍在太和殿举行。',
    sources: [
      ['保和殿', buildingPage(236434)],
      ['清代殿试制度', 'https://www.dpm.org.cn/court/system/236363.html']
    ]
  }
];

export const places = [...outerAxis, ...outerPlaces, ...innerPlaces, ...wingPlaces, ...gardenArchives, ...specialPlaces];

const linkedEvents = [
  'wenhua', 'wuying', 'taihemen', 'jingren', 'kunning', 'taihe', 'qianqingmen',
  'nanshufang', 'qianqing', 'shoukang', 'yuhua', 'chizao', 'wenyuan', 'baohe',
  'longzongmen', 'chuxiu', 'xihua', 'shenwu', 'wumen'
].map(id => {
  const place = places.find(item => item.id === id);
  const year = Number(place.year);
  const era = id === 'wuying' ? '明清之际' : year < 1644 ? '明' : year < 1912 ? '清' : year < 1949 ? '近代' : '当代';
  return [year, era, place.person, place.story, id];
});

export const timeline = [
  [1406, '明', '永乐营建', '明成祖朱棣下诏营建北京宫殿，工程由此展开。'],
  [1420, '明', '紫禁城建成', '永乐十八年，北京宫殿建成，中轴线上形成层层递进的宫廷空间。'],
  ...linkedEvents,
  [1925, '近代', '故宫博物院成立', '10月10日，故宫博物院开院，宫殿和收藏向公众开放。'],
  [1987, '当代', '列入世界遗产', '北京故宫列入《世界遗产名录》。']
].sort((a, b) => a[0] - b[0]);
