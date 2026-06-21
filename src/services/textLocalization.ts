type TranslateFn = (zh: string, enText: string) => string;

const mockTextMap: Record<string, [string, string]> = {
  Australia: ['澳大利亚', 'Australia'],
  'United States': ['美国', 'United States'],
  mvp: ['MVP 试用', 'MVP'],
  family_plus: ['家庭增强版', 'Family Plus'],
  clinical: ['临床版', 'Clinical'],

  'Coco device offline for 12h': ['Coco 设备已离线 12 小时', 'Coco device offline for 12h'],
  'Rio active heart rate above baseline': ['Rio 运动心率高于基线', 'Rio active heart rate above baseline'],
  'Algorithm confidence below threshold': ['算法置信度低于阈值', 'Algorithm confidence below threshold'],

  'Viewed device fleet': ['查看设备队列', 'Viewed device fleet'],
  'Updated sharing permission': ['更新共享权限', 'Updated sharing permission'],
  'Acknowledged alert': ['确认告警', 'Acknowledged alert'],
  'All devices': ['所有设备', 'All devices'],
  'Dad health data': ['Dad 的健康数据', 'Dad health data'],

  'Annual vaccination': ['年度疫苗', 'Annual vaccination'],
  'Wellness check': ['健康体检', 'Wellness check'],
  'Skin allergy medication': ['皮肤过敏用药', 'Skin allergy medication'],
  'Blood test': ['血液检查', 'Blood test'],
  'Dental check': ['牙齿检查', 'Dental check'],
  'Exercise heart rate review': ['运动心率复核', 'Exercise heart rate review'],
  'June wellness report': ['6 月健康报告', 'June wellness report'],
  'Medication follow-up report': ['用药随访报告', 'Medication follow-up report'],
  'Offline data recovery report': ['离线数据恢复报告', 'Offline data recovery report'],
  'Dental care report': ['牙齿护理报告', 'Dental care report'],
  'Active heart rate review': ['运动心率复核', 'Active heart rate review'],

  'Core vaccine completed. No adverse reaction reported.': [
    '核心疫苗已完成，未报告不良反应。',
    'Core vaccine completed. No adverse reaction reported.',
  ],
  'Weight stable. Heart and respiratory checks normal.': [
    '体重稳定，心脏和呼吸检查正常。',
    'Weight stable. Heart and respiratory checks normal.',
  ],
  'Two-week medication course. Review if scratching continues.': [
    '两周用药疗程；如果抓挠持续，需要复查。',
    'Two-week medication course. Review if scratching continues.',
  ],
  'Baseline lab result uploaded for future comparison.': [
    '基础化验结果已上传，用于后续对比。',
    'Baseline lab result uploaded for future comparison.',
  ],
  'Mild tartar noted. Monitor appetite and chewing.': [
    '发现轻微牙结石，需观察食欲和咀嚼情况。',
    'Mild tartar noted. Monitor appetite and chewing.',
  ],
  'Review requested after active heart rate exceeded baseline.': [
    '运动心率超过基线后，已建议复核。',
    'Review requested after active heart rate exceeded baseline.',
  ],
  'Activity and resting heart rate stayed within expected range.': [
    '活动量和静息心率保持在预期范围内。',
    'Activity and resting heart rate stayed within expected range.',
  ],
  'Elevated activity heart rate should be reviewed with symptoms.': [
    '活动心率偏高，需结合症状复核。',
    'Elevated activity heart rate should be reviewed with symptoms.',
  ],
  'Waiting for collar sync before backend can complete analysis.': [
    '等待项圈同步后，后端才能完成分析。',
    'Waiting for collar sync before backend can complete analysis.',
  ],
  'Vet uploaded dental check summary and care advice.': [
    '兽医已上传牙齿检查摘要和护理建议。',
    'Vet uploaded dental check summary and care advice.',
  ],
  'Backend flagged sustained elevated heart rate during exercise.': [
    '后端标记运动期间持续心率偏高。',
    'Backend flagged sustained elevated heart rate during exercise.',
  ],
};

export function localizeMockText(value: string | undefined, translate: TranslateFn) {
  if (!value) {
    return '-';
  }
  const localized = mockTextMap[value];
  if (!localized) {
    return value;
  }
  return translate(localized[0], localized[1]);
}
