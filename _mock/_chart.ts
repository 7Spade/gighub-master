import { format } from 'date-fns';
import * as Mock from 'mockjs';

// region: mock data - Construction Site Progress Tracking

// 作業人數趨勢數據 (Worker count trend)
const visitData: any[] = [];
const beginDay = new Date().getTime();

const fakeY = [45, 52, 48, 38, 42, 55, 50, 58, 52, 62, 48, 35, 28, 45, 38, 52, 48];
for (let i = 0; i < fakeY.length; i += 1) {
  visitData.push({
    x: format(new Date(beginDay + 1000 * 60 * 60 * 24 * i), 'yyyy-MM-dd'),
    y: fakeY[i]
  });
}

// 工時數據 (Work hours data)
const visitData2: any[] = [];
const fakeY2 = [8, 9, 8, 10, 7, 9, 8];
for (let i = 0; i < fakeY2.length; i += 1) {
  visitData2.push({
    x: format(new Date(beginDay + 1000 * 60 * 60 * 24 * i), 'yyyy-MM-dd'),
    y: fakeY2[i]
  });
}

// 月度施工進度 (Monthly construction progress)
const salesData: any[] = [];
for (let i = 0; i < 12; i += 1) {
  salesData.push({
    x: `${i + 1}月`,
    y: Math.floor(Math.random() * 30) + 60 // 60-90% progress range
  });
}

// 施工項目數據 (Construction project items)
const constructionItems = [
  '地基工程',
  '主体结构',
  '外墙施工',
  '水电安装',
  '内部装修',
  '消防系统',
  '电梯安装',
  '园林绿化',
  '道路铺设',
  '停车场建设',
  '门窗安装',
  '屋顶防水',
  '外立面装饰',
  '污水处理',
  '供暖系统'
];
const searchData: any[] = [];
for (let i = 0; i < 50; i += 1) {
  searchData.push({
    index: i + 1,
    keyword: `${constructionItems[i % constructionItems.length]}-${Math.floor(i / constructionItems.length) + 1}`,
    count: Math.floor(Math.random() * 50) + 10, // 作業人數
    range: Math.floor(Math.random() * 30) + 5, // 週進度
    status: Math.floor((Math.random() * 10) % 2)
  });
}

// 施工類型數據 - 全部工區 (Construction type data - All zones)
const salesTypeData = [
  {
    x: '土建工程',
    y: 4544
  },
  {
    x: '机电安装',
    y: 3321
  },
  {
    x: '装饰装修',
    y: 3113
  },
  {
    x: '消防系统',
    y: 2341
  },
  {
    x: '给排水工程',
    y: 1231
  },
  {
    x: '其他工程',
    y: 1231
  }
];

// 施工類型數據 - 室內 (Construction type data - Indoor)
const salesTypeDataOnline = [
  {
    x: '电气安装',
    y: 244
  },
  {
    x: '管道施工',
    y: 321
  },
  {
    x: '墙面处理',
    y: 311
  },
  {
    x: '地面铺设',
    y: 141
  },
  {
    x: '吊顶工程',
    y: 121
  },
  {
    x: '其他',
    y: 111
  }
];

// 施工類型數據 - 室外 (Construction type data - Outdoor)
const salesTypeDataOffline = [
  {
    x: '外墙施工',
    y: 199
  },
  {
    x: '屋顶工程',
    y: 188
  },
  {
    x: '园林绿化',
    y: 344
  },
  {
    x: '道路铺设',
    y: 255
  },
  {
    x: '其他',
    y: 65
  }
];

// 工區數據 (Work zone data)
const offlineData: any[] = [];
const workZoneNames = [
  'A区-主楼',
  'B区-副楼',
  'C区-车库',
  'D区-配套',
  'E区-绿化',
  'F区-道路',
  'G区-围墙',
  'H区-广场',
  'I区-设备房',
  'J区-门卫'
];
for (let i = 0; i < 10; i += 1) {
  offlineData.push({
    name: workZoneNames[i],
    cvr: Math.ceil(Math.random() * 9) / 10
  });
}

// 施工進度時間線數據 (Construction timeline data)
const offlineChartData: any[] = [];
for (let i = 0; i < 20; i += 1) {
  offlineChartData.push({
    time: new Date().getTime() + 1000 * 60 * 30 * i,
    y1: Math.floor(Math.random() * 60) + 30, // 作業人數
    y2: Math.floor(Math.random() * 20) + 5 // 完成任務數
  });
}

// 施工效率指標 (Construction efficiency metrics)
const radarOriginData = [
  {
    name: '土建班组',
    ref: 10,
    koubei: 8,
    output: 9,
    contribute: 7,
    hot: 8
  },
  {
    name: '机电班组',
    ref: 8,
    koubei: 9,
    output: 7,
    contribute: 8,
    hot: 6
  },
  {
    name: '装修班组',
    ref: 7,
    koubei: 7,
    output: 8,
    contribute: 9,
    hot: 7
  }
];

const radarData: any[] = [];
const radarTitleMap: any = {
  ref: '进度',
  koubei: '质量',
  output: '效率',
  contribute: '安全',
  hot: '配合度'
};
radarOriginData.forEach((item: any) => {
  Object.keys(item).forEach(key => {
    if (key !== 'name') {
      radarData.push({
        name: item.name,
        label: radarTitleMap[key],
        value: item[key]
      });
    }
  });
});

// endregion

export const CHARTS = {
  '/chart': JSON.parse(
    JSON.stringify({
      visitData,
      visitData2,
      salesData,
      searchData,
      offlineData,
      offlineChartData,
      salesTypeData,
      salesTypeDataOnline,
      salesTypeDataOffline,
      radarData
    })
  ),
  '/chart/visit': JSON.parse(JSON.stringify(visitData)),
  '/chart/tags': Mock.mock({
    'list|100': [{ name: '@city', 'value|1-100': 150 }]
  })
};
