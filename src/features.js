export const features = [
  {
    id: 'taihe-terraces',
    parentId: 'taihe',
    name: '三重须弥座',
    en: 'Three-tiered Marble Terrace',
    // South face of the second tier, east of the axial stairs (mesh 6).
    anchor: [-149, 4.8, -2204.45],
    offset: [17, 15, 33],
    photo: {
      src: './photos/taihe-terraces.webp',
      caption: '从太和殿广场向北看，三层石栏由下至上逐层内收。',
      source: 'https://commons.wikimedia.org/wiki/File:Hall_of_Supreme_Harmony.JPG',
      credit: 'Gisling，2008 年摄，原图局部',
      license: 'CC BY 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0/'
    },
    form: '从广场向上数，太和殿脚下的汉白玉台基共分三层，每升一层，台面便向内退一圈。这样的基座叫须弥座。三层叠在一起，俗称“三台”，一直延伸到中和殿、保和殿。',
    use: '台基把三大殿托举在广场之上。沿着照片中的白石栏杆看，栏杆下方伸出的石雕龙头还承担排水的作用。下大雨时，台面的积水从龙口流出。',
    sources: [
      ['三台 · 故宫博物院', 'https://www.dpm.org.cn/lemmas/244152.html'],
      ['太和殿 · 故宫博物院', 'https://www.dpm.org.cn/explore/building/236465.html']
    ]
  },
  {
    id: 'taihe-ramp',
    parentId: 'taihe',
    name: '云龙御路石',
    en: 'Dragon-carved Imperial Ramp',
    // Centre of the lowest sloping slab between the two stair flights (mesh 4).
    anchor: [-165.8, 1.9, -2187.7],
    offset: [7, 20, 30],
    photo: {
      src: './photos/taihe-ramp.webp',
      caption: '太和殿南面正中的御路石。近处可见山石和水纹，顺着云龙向上望去便是殿门。',
      source: 'https://commons.wikimedia.org/wiki/File:Citt%C3%A0_proibita,_piazzale_tianhedian,_con_padiglione_della_suprema_armonia,_rampa_con_draghi_in_volo_01.jpg',
      credit: 'Francesco Bini，2024 年摄，缩小',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/'
    },
    form: '太和殿前，左右两列台阶夹着一带向上倾斜的石面，这就是御路石。先看石面下方的海水和山峰，再向上找翻卷的云纹与龙身。故宫古建研究者将这里一升一降的龙纹称为“升降龙”。',
    use: '从广场沿石面向上看，三层台基中央的御路正对太和殿明间。它把宫城中轴线延伸到殿门前，龙纹与居中的位置共同标示这条礼仪通道的尊贵。',
    sources: [
      ['御路石 · 故宫博物院', 'https://www.dpm.org.cn/lemmas/244764.html'],
      ['御路石纹样对照（图八）· 故宫研究院', 'https://www.dpm.org.cn/learing_detail/251617.html']
    ]
  }
];
