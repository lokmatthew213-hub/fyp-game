// ─────────────────────────────────────────────
// Context Cards (情境地圖牌) — 10 cards total
// ─────────────────────────────────────────────

export interface ContextSegment {
  label: string;
  key: 'red' | 'yellow' | 'blue';
  value: number;
  color: string;
  textColor: string;
  icon: string;
  barColor: string;
}

export interface ContextCard {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  base: number;
  segments: ContextSegment[];
  hint: string | null;
  showNumbers: boolean;
}

export interface ContextData {
  red?: number | null;
  yellow?: number | null;
  blue?: number | null;
  base?: number;
  total?: number;
}

export const CONTEXT_CARDS: ContextCard[] = [
  {
    id: 'standard',
    name: '標準分佈',
    nameEn: 'Standard',
    description: '基本百分比練習，數據清晰易讀',
    base: 100,
    segments: [
      { label: '紅色部', key: 'red',    value: 20,  color: 'bg-red-500',    textColor: 'text-red-600',    icon: '🔴', barColor: '#ef4444' },
      { label: '黃色部', key: 'yellow', value: 30,  color: 'bg-amber-400',  textColor: 'text-amber-600',  icon: '🟡', barColor: '#f59e0b' },
      { label: '藍色部', key: 'blue',   value: 50,  color: 'bg-blue-500',   textColor: 'text-blue-600',   icon: '🔵', barColor: '#3b82f6' },
    ],
    hint: null,
    showNumbers: true,
  },
  {
    id: 'scattered',
    name: '零散分佈',
    nameEn: 'Scattered',
    description: '數據分佈不均，需細心觀察',
    base: 100,
    segments: [
      { label: '紅色部', key: 'red',    value: 5,   color: 'bg-red-500',    textColor: 'text-red-600',    icon: '🔴', barColor: '#ef4444' },
      { label: '黃色部', key: 'yellow', value: 15,  color: 'bg-amber-400',  textColor: 'text-amber-600',  icon: '🟡', barColor: '#f59e0b' },
      { label: '藍色部', key: 'blue',   value: 80,  color: 'bg-blue-500',   textColor: 'text-blue-600',   icon: '🔵', barColor: '#3b82f6' },
    ],
    hint: '需細心數！',
    showNumbers: true,
  },
  {
    id: 'duel',
    name: '二元對決',
    nameEn: 'Duel',
    description: '只有兩個陣營的對決',
    base: 100,
    segments: [
      { label: '紅色部', key: 'red',    value: 45,  color: 'bg-red-500',    textColor: 'text-red-600',    icon: '🔴', barColor: '#ef4444' },
      { label: '藍色部', key: 'blue',   value: 55,  color: 'bg-blue-500',   textColor: 'text-blue-600',   icon: '🔵', barColor: '#3b82f6' },
    ],
    hint: null,
    showNumbers: true,
  },
  {
    id: 'majority',
    name: '數量比較',
    nameEn: 'Majority',
    description: '訓練分子大於分母的情況 (答案 250%)',
    base: 10,
    segments: [
      { label: '紅色部', key: 'red',    value: 25,  color: 'bg-red-500',    textColor: 'text-red-600',    icon: '🔴', barColor: '#ef4444' },
      { label: '藍色部', key: 'blue',   value: 10,  color: 'bg-blue-500',   textColor: 'text-blue-600',   icon: '🔵', barColor: '#3b82f6' },
    ],
    hint: '分子 > 分母！答案可超過 100%',
    showNumbers: true,
  },
  {
    id: 'multiple',
    name: '倍數關係',
    nameEn: 'Multiple',
    description: '訓練倍數關係 (答案 200%)',
    base: 5,
    segments: [
      { label: '紅色部', key: 'red',    value: 10,  color: 'bg-red-500',    textColor: 'text-red-600',    icon: '🔴', barColor: '#ef4444' },
      { label: '藍色部', key: 'blue',   value: 5,   color: 'bg-blue-500',   textColor: 'text-blue-600',   icon: '🔵', barColor: '#3b82f6' },
    ],
    hint: '分子 > 分母！答案可超過 100%',
    showNumbers: true,
  },
  {
    id: 'class50',
    name: '50人班級',
    nameEn: 'Class 50',
    description: '總數 50，需擴分計算',
    base: 50,
    segments: [
      { label: '紅色部', key: 'red',    value: 10,  color: 'bg-red-500',    textColor: 'text-red-600',    icon: '🔴', barColor: '#ef4444' },
      { label: '黃色部', key: 'yellow', value: 20,  color: 'bg-amber-400',  textColor: 'text-amber-600',  icon: '🟡', barColor: '#f59e0b' },
      { label: '藍色部', key: 'blue',   value: 20,  color: 'bg-blue-500',   textColor: 'text-blue-600',   icon: '🔵', barColor: '#3b82f6' },
    ],
    hint: '總數 50，需擴分！',
    showNumbers: true,
  },
  {
    id: 'balloons',
    name: '20個氣球',
    nameEn: 'Balloons',
    description: '總數 20，需擴分計算',
    base: 20,
    segments: [
      { label: '紅色部', key: 'red',    value: 5,   color: 'bg-red-500',    textColor: 'text-red-600',    icon: '🔴', barColor: '#ef4444' },
      { label: '藍色部', key: 'blue',   value: 15,  color: 'bg-blue-500',   textColor: 'text-blue-600',   icon: '🔵', barColor: '#3b82f6' },
    ],
    hint: '總數 20，需擴分！',
    showNumbers: true,
  },
  {
    id: 'doublegrid',
    name: '雙百圖',
    nameEn: 'Double Grid',
    description: '總數 200，需約分計算',
    base: 200,
    segments: [
      { label: '紅色部', key: 'red',    value: 40,  color: 'bg-red-500',    textColor: 'text-red-600',    icon: '🔴', barColor: '#ef4444' },
      { label: '黃色部', key: 'yellow', value: 60,  color: 'bg-amber-400',  textColor: 'text-amber-600',  icon: '🟡', barColor: '#f59e0b' },
      { label: '藍色部', key: 'blue',   value: 100, color: 'bg-blue-500',   textColor: 'text-blue-600',   icon: '🔵', barColor: '#3b82f6' },
    ],
    hint: '總數 200，需約分！',
    showNumbers: true,
  },
  {
    id: 'vote',
    name: '投票結果',
    nameEn: 'Vote',
    description: '無數字標示，引導做 12+13=25',
    base: 100,
    segments: [
      { label: '紅色部', key: 'red',    value: 12,  color: 'bg-red-500',    textColor: 'text-red-600',    icon: '🔴', barColor: '#ef4444' },
      { label: '黃色部', key: 'yellow', value: 13,  color: 'bg-amber-400',  textColor: 'text-amber-600',  icon: '🟡', barColor: '#f59e0b' },
      { label: '藍色部', key: 'blue',   value: 75,  color: 'bg-blue-500',   textColor: 'text-blue-600',   icon: '🔵', barColor: '#3b82f6' },
    ],
    hint: '提示：紅 + 黃 = 25',
    showNumbers: false,
  },
  {
    id: 'party',
    name: '派對食物',
    nameEn: 'Party',
    description: '無數字標示，引導做 35+35=70',
    base: 100,
    segments: [
      { label: '紅色部', key: 'red',    value: 35,  color: 'bg-red-500',    textColor: 'text-red-600',    icon: '🔴', barColor: '#ef4444' },
      { label: '黃色部', key: 'yellow', value: 35,  color: 'bg-amber-400',  textColor: 'text-amber-600',  icon: '🟡', barColor: '#f59e0b' },
      { label: '藍色部', key: 'blue',   value: 30,  color: 'bg-blue-500',   textColor: 'text-blue-600',   icon: '🔵', barColor: '#3b82f6' },
    ],
    hint: '提示：紅 + 黃 = 70',
    showNumbers: false,
  },
];

export const drawContextCard = (excludeId: string | null = null): ContextCard => {
  const available = excludeId
    ? CONTEXT_CARDS.filter(c => c.id !== excludeId)
    : CONTEXT_CARDS;
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
};

export const buildContextData = (card: ContextCard): ContextData => {
  const data: ContextData = { base: card.base };
  card.segments.forEach(seg => {
    (data as Record<string, number>)[seg.key] = seg.value;
  });
  return data;
};
