import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, BookOpen, BarChart2, ChevronLeft, User, AlertTriangle } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../_core/hooks/useAuth';
import { Link } from 'wouter';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type HistoryRow = {
  id: number;
  userId: number | null;
  playerName: string;
  sentence: string;
  isCorrect: boolean;
  feedback: string;
  strategy: string;
  contextCardName: string;
  contextCardBase: number;
  gameMode: string;
  createdAt: number;
};

type ErrorAnalysisRow = {
  cardName: string;
  count: number;
  examples: string[];
};

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
function formatTime(ts: number) {
  return new Date(ts).toLocaleString('zh-HK', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─────────────────────────────────────────────
// Admin History Page
// ─────────────────────────────────────────────
function AdminHistoryView() {
  const [tab, setTab] = useState<'records' | 'analysis'>('records');
  const [filterCorrect, setFilterCorrect] = useState<'all' | 'correct' | 'wrong'>('all');
  const [filterCard, setFilterCard] = useState<string>('all');

  const { data: rows = [], isLoading } = trpc.history.allHistory.useQuery();
  const { data: errorAnalysis = [], isLoading: isAnalysisLoading } = trpc.history.errorAnalysis.useQuery();

  const allCardNames = Array.from(new Set((rows as HistoryRow[]).map(r => r.contextCardName)));

  const filtered = (rows as HistoryRow[]).filter(r => {
    if (filterCorrect === 'correct' && !r.isCorrect) return false;
    if (filterCorrect === 'wrong' && r.isCorrect) return false;
    if (filterCard !== 'all' && r.contextCardName !== filterCard) return false;
    return true;
  });

  const totalCount = (rows as HistoryRow[]).length;
  const correctCount = (rows as HistoryRow[]).filter(r => r.isCorrect).length;
  const correctRate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-semibold">
              <ChevronLeft size={16} />
              返回遊戲
            </button>
          </Link>
          <div className="flex-1" />
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-500" />
            學生作答紀錄
          </h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">總作答次數</p>
            <p className="text-3xl font-black text-slate-800">{totalCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">正確率</p>
            <p className="text-3xl font-black text-emerald-600">{correctRate}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">錯誤次數</p>
            <p className="text-3xl font-black text-red-500">{totalCount - correctCount}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('records')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black transition-all ${
              tab === 'records'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            <User size={14} />
            作答紀錄
          </button>
          <button
            onClick={() => setTab('analysis')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black transition-all ${
              tab === 'analysis'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            <BarChart2 size={14} />
            常見錯誤分析
          </button>
        </div>

        {/* Records Tab */}
        {tab === 'records' && (
          <div>
            {/* Filters */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <select
                value={filterCorrect}
                onChange={e => setFilterCorrect(e.target.value as 'all' | 'correct' | 'wrong')}
                className="text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 focus:outline-none focus:border-indigo-400"
              >
                <option value="all">全部</option>
                <option value="correct">✅ 正確</option>
                <option value="wrong">❌ 錯誤</option>
              </select>
              <select
                value={filterCard}
                onChange={e => setFilterCard(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 focus:outline-none focus:border-indigo-400"
              >
                <option value="all">所有情境卡</option>
                {allCardNames.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-xs text-slate-400 font-bold self-center ml-1">
                顯示 {filtered.length} 筆
              </span>
            </div>

            {isLoading ? (
              <div className="text-center py-16 text-slate-400 font-bold">載入中...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-bold">尚無作答紀錄</div>
            ) : (
              <div className="space-y-2">
                {(filtered as HistoryRow[]).map((row, i) => (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`bg-white rounded-xl p-3 shadow-sm border-l-4 ${
                      row.isCorrect ? 'border-emerald-400' : 'border-red-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {row.isCorrect
                          ? <CheckCircle size={16} className="text-emerald-500" />
                          : <XCircle size={16} className="text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-black text-slate-700">{row.playerName}</span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-bold">
                            {row.contextCardName}
                          </span>
                          <span className="text-[10px] bg-slate-50 text-slate-400 border border-slate-100 px-2 py-0.5 rounded-full font-bold">
                            策略 {row.strategy}
                          </span>
                          <span className="text-[10px] text-slate-300 ml-auto">{formatTime(row.createdAt)}</span>
                        </div>
                        <p className="text-sm font-black text-slate-800 mb-1">「{row.sentence}」</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{row.feedback}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error Analysis Tab */}
        {tab === 'analysis' && (
          <div>
            {isAnalysisLoading ? (
              <div className="text-center py-16 text-slate-400 font-bold">分析中...</div>
            ) : (errorAnalysis as ErrorAnalysisRow[]).length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-bold">尚無錯誤紀錄</div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 font-bold mb-2">
                  以下顯示各情境卡的錯誤次數，幫助老師了解學生的常見困難。
                </p>
                {(errorAnalysis as ErrorAnalysisRow[]).map((item, i) => (
                  <motion.div
                    key={item.cardName}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                      <span className="font-black text-slate-800">{item.cardName}</span>
                      <span className="ml-auto text-sm font-black text-red-500">{item.count} 次錯誤</span>
                    </div>
                    {/* Error bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                      <div
                        className="bg-red-400 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (item.count / Math.max(...(errorAnalysis as ErrorAnalysisRow[]).map(x => x.count))) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">常見錯誤句子範例</p>
                      {item.examples.map((ex, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <XCircle size={11} className="text-red-400 flex-shrink-0" />
                          <span className="text-xs text-slate-600">「{ex}」</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Student History View (own records only)
// ─────────────────────────────────────────────
function StudentHistoryView() {
  const { data: rows = [], isLoading } = trpc.history.myHistory.useQuery();

  const totalCount = (rows as HistoryRow[]).length;
  const correctCount = (rows as HistoryRow[]).filter(r => r.isCorrect).length;
  const correctRate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-semibold">
              <ChevronLeft size={16} />
              返回遊戲
            </button>
          </Link>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 flex-1 justify-end">
            <BookOpen size={20} className="text-indigo-500" />
            我的練習紀錄
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">總作答次數</p>
            <p className="text-3xl font-black text-slate-800">{totalCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">正確率</p>
            <p className="text-3xl font-black text-emerald-600">{correctRate}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">錯誤次數</p>
            <p className="text-3xl font-black text-red-500">{totalCount - correctCount}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400 font-bold">載入中...</div>
        ) : (rows as HistoryRow[]).length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-bold">
            <BookOpen size={40} className="mx-auto mb-3 text-slate-200" />
            尚無練習紀錄，快去玩一局吧！
          </div>
        ) : (
          <div className="space-y-2">
            {(rows as HistoryRow[]).map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`bg-white rounded-xl p-3 shadow-sm border-l-4 ${
                  row.isCorrect ? 'border-emerald-400' : 'border-red-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {row.isCorrect
                      ? <CheckCircle size={16} className="text-emerald-500" />
                      : <XCircle size={16} className="text-red-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-bold">
                        {row.contextCardName}
                      </span>
                      <span className="text-[10px] bg-slate-50 text-slate-400 border border-slate-100 px-2 py-0.5 rounded-full font-bold">
                        策略 {row.strategy}
                      </span>
                      <span className="text-[10px] text-slate-300 ml-auto">{formatTime(row.createdAt)}</span>
                    </div>
                    <p className="text-sm font-black text-slate-800 mb-1">「{row.sentence}」</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{row.feedback}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Export: route to admin or student view
// ─────────────────────────────────────────────
export default function HistoryPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">
        載入中...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
        <BookOpen size={40} className="text-slate-300" />
        <p className="font-bold">請先登入才能查看作答紀錄</p>
        <Link href="/">
          <button className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold text-sm">
            <ChevronLeft size={14} />
            返回首頁
          </button>
        </Link>
      </div>
    );
  }

  return user.role === 'admin' ? <AdminHistoryView /> : <StudentHistoryView />;
}
