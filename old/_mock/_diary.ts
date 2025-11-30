import { MockRequest } from '@delon/mock';

// region: mock data

const weathers = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy'];
const authors = ['張三', '李四', '王五', '趙六', '陳七'];
const issueSeverities = ['low', 'medium', 'high', 'critical'];
const issueStatuses = ['open', 'in_progress', 'resolved'];

function generateDiaries(count = 20): any[] {
  const diaries: any[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const photoCount = Math.floor(Math.random() * 8);
    const photos = Array.from({ length: photoCount }, (_, j) => ({
      id: `photo-${i}-${j}`,
      url: `https://picsum.photos/800/600?random=${i * 10 + j}`,
      thumbnailUrl: `https://picsum.photos/200/150?random=${i * 10 + j}`,
      caption: `工地照片 ${j + 1}`,
      uploadedAt: date.toISOString(),
      uploadedBy: `user-${Math.floor(Math.random() * 5) + 1}`
    }));

    const issueCount = Math.floor(Math.random() * 4);
    const issues = Array.from({ length: issueCount }, (_, j) => ({
      id: `issue-${i}-${j}`,
      description: `問題描述 ${j + 1}: 發現施工區域有異常狀況`,
      severity: issueSeverities[Math.floor(Math.random() * issueSeverities.length)],
      status: issueStatuses[Math.floor(Math.random() * issueStatuses.length)],
      createdAt: date.toISOString()
    }));

    diaries.push({
      id: `diary-${i + 1}`,
      workspaceId: 'workspace-1',
      blueprintId: 'blueprint-1',
      date: date.toISOString().split('T')[0],
      weather: weathers[Math.floor(Math.random() * weathers.length)],
      temperature: Math.floor(Math.random() * 20) + 15,
      title: `${date.getMonth() + 1}月${date.getDate()}日 工地日誌`,
      summary: i === 0 ? '今日進度正常，無重大事項' : `今日完成第${i}階段施工`,
      content: `今日工作進度報告：\n\n1. 完成基礎工程檢查\n2. 進行結構補強作業\n3. 現場安全巡檢\n\n天氣狀況良好，施工順利進行。`,
      progressDescription: `第${Math.floor(i / 3) + 1}階段進行中，完成度約${Math.floor(Math.random() * 30) + 70}%`,
      photos,
      attachments: [],
      issues,
      linkedTodoIds: issueCount > 0 ? [`todo-${i + 1}`] : [],
      authorId: `user-${(i % 5) + 1}`,
      authorName: authors[i % 5],
      createdAt: date.toISOString(),
      updatedAt: date.toISOString()
    });
  }

  return diaries;
}

const diaryList = generateDiaries(30);

function getDiaries(params: any): { total: number; list: any[] } {
  let result = [...diaryList];

  // Filter by workspaceId
  if (params.workspaceId) {
    result = result.filter(d => d.workspaceId === params.workspaceId);
  }

  // Filter by blueprintId
  if (params.blueprintId) {
    result = result.filter(d => d.blueprintId === params.blueprintId);
  }

  // Filter by date range
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    result = result.filter(d => {
      const date = new Date(d.date);
      return date >= start && date <= end;
    });
  }

  // Pagination
  const pi = +(params.pi || 1);
  const ps = +(params.ps || 10);
  const start = (pi - 1) * ps;

  return {
    total: result.length,
    list: result.slice(start, start + ps)
  };
}

function createDiary(body: any): any {
  const newDiary = {
    id: `diary-${Date.now()}`,
    ...body,
    photos: [],
    attachments: [],
    issues: [],
    linkedTodoIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  diaryList.unshift(newDiary);
  return newDiary;
}

function updateDiary(id: string, body: any): any {
  const index = diaryList.findIndex(d => d.id === id);
  if (index === -1) {
    return { error: 'Diary not found' };
  }
  diaryList[index] = {
    ...diaryList[index],
    ...body,
    updatedAt: new Date().toISOString()
  };
  return diaryList[index];
}

function deleteDiary(id: string): any {
  const index = diaryList.findIndex(d => d.id === id);
  if (index === -1) {
    return { error: 'Diary not found' };
  }
  diaryList.splice(index, 1);
  return { msg: 'ok' };
}

// endregion

export const DIARIES = {
  '/api/diaries': (req: MockRequest) => getDiaries(req.queryString),
  '/api/diaries/:id': (req: MockRequest) => diaryList.find(d => d.id === req.params.id),
  'POST /api/diaries': (req: MockRequest) => createDiary(req.body),
  'PUT /api/diaries/:id': (req: MockRequest) => updateDiary(req.params.id, req.body),
  'DELETE /api/diaries/:id': (req: MockRequest) => deleteDiary(req.params.id)
};
