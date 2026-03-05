import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  User,
  RotateCcw,
  Info,
  Layers,
  Trash2,
  Sword,
  Bot,
  Settings,
  History,
  Activity,
  Zap,
  Target,
  BrainCircuit,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  GripVertical,
  Shuffle,
} from 'lucide-react';
import { generateNDeck, generateWDeck, CARD_TYPES } from './data/decks';
import { judgeSubmission, getNpcMove } from './utils/aiJudge';
import { CONTEXT_CARDS, drawContextCard, buildContextData } from './data/contextCards';

// ─────────────────────────────────────────────
// StartMenu Component
// ─────────────────────────────────────────────
const StartMenu = ({ onSelectMode, onStartBattle }) => {
  const [phase, setPhase] = useState('MODE');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [driver, setDriver] = useState('ALGORITHM');

  if (phase === 'SETUP') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-amber-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-amber-500" size={32} />
            <h1 className="text-2xl font-black text-slate-800">戰局設定 (NPC Config)</h1>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">驅動方式 (Driver Type)</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'ALGORITHM', label: '演算法', icon: Zap },
                  { id: 'AI', label: 'AI 驅動', icon: BrainCircuit },
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDriver(d.id)}
                    className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all
                      ${driver === d.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-400 opacity-60 hover:opacity-100'}`}
                  >
                    <d.icon size={18} /> {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">難度等級 (Difficulty)</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'LOW', label: '低級', color: 'bg-emerald-50 text-emerald-600 border-emerald-500' },
                  { id: 'MEDIUM', label: '中級', color: 'bg-amber-50 text-amber-600 border-amber-500' },
                  { id: 'HIGH', label: '高級', color: 'bg-rose-50 text-rose-600 border-rose-500' },
                ].map(level => (
                  <button
                    key={level.id}
                    onClick={() => setDifficulty(level.id)}
                    className={`py-3 rounded-xl font-bold border-2 transition-all
                      ${difficulty === level.id ? level.color : 'bg-slate-50 border-transparent text-slate-400 opacity-60 hover:opacity-100'}`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <button
                onClick={() => setPhase('MODE')}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all active:scale-95"
              >
                返回
              </button>
              <button
                onClick={() => onStartBattle(difficulty, driver)}
                className="flex-[2] py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Sword size={20} /> 開始戰鬥
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border-4 border-indigo-100"
      >
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sword className="text-amber-600" size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">百分戰局</h1>
        <p className="text-slate-500 mb-8 font-medium italic">Percent Battle: Mathematical Commander</p>
        <div className="space-y-4">
          <button
            onClick={() => onSelectMode('PRACTICE')}
            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-3"
          >
            <RotateCcw size={20} /> 練習模式 (Solo Practice)
          </button>
          <button
            onClick={() => setPhase('SETUP')}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-3"
          >
            <Sword size={20} /> 對戰模式 (vs 3 NPCs)
          </button>
        </div>
        <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Select your mission, Commander.
        </p>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────
// WildCardSelector Component
// ─────────────────────────────────────────────
const WildCardSelector = ({ type, onSelect, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full"
      >
        <h3 className="text-lg font-black text-slate-700 mb-4 text-center">
          Select Wild Card Value ({type === 'n' ? 'Number' : 'Word'})
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {type === 'n' ? (
            ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
              <button
                key={val}
                onClick={() => onSelect(val)}
                className="aspect-square bg-slate-100 hover:bg-indigo-500 hover:text-white rounded-xl font-black text-xl transition-colors"
              >
                {val}
              </button>
            ))
          ) : (
            ['紅色', '黃色', '藍色', '全部', '是', '佔', '/', '的', '+', '%'].map(val => (
              <button
                key={val}
                onClick={() => onSelect(val)}
                className="py-2 px-1 bg-slate-100 hover:bg-amber-500 hover:text-white rounded-xl font-bold text-xs transition-colors truncate"
              >
                {val}
              </button>
            ))
          )}
        </div>
        <button
          onClick={onCancel}
          className="mt-6 w-full py-3 bg-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-300"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────
// BattleLog Component — Collapsible Side Panel
// ─────────────────────────────────────────────
const BattleLog = ({ history, isOpen, onToggle }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <>
      {/* Toggle Button — always visible */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-[60] flex items-center gap-1 px-2 py-4 rounded-l-xl shadow-lg border border-r-0 border-slate-200 transition-all duration-300
          ${isOpen ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-white text-indigo-500 hover:bg-indigo-50'}`}
        title={isOpen ? '隱藏戰鬥日誌' : '顯示戰鬥日誌'}
        style={{ right: isOpen ? '320px' : '0px' }}
      >
        <div className="flex flex-col items-center gap-1">
          {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            Battle Log
          </span>
          {history.length > 0 && !isOpen && (
            <span className="w-5 h-5 bg-indigo-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {history.length > 99 ? '99+' : history.length}
            </span>
          )}
        </div>
      </button>

      {/* Side Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 border-l border-slate-200 bg-white flex flex-col z-50 shadow-2xl"
          >
            <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <History className="text-indigo-500" size={20} />
                <h3 className="font-bold text-slate-700">戰鬥日誌 (Battle Log)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">{history.length} 筆</span>
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar"
            >
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2 opacity-50">
                  <Activity size={48} />
                  <p className="text-xs font-bold uppercase tracking-widest">Awaiting actions...</p>
                </div>
              ) : (
                history.map((entry, idx) => (entry && entry.timestamp && (
                  <motion.div
                    key={`${entry.timestamp}-${idx}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-xl border flex flex-col gap-1 shadow-sm
                      ${entry.special ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${entry.isHuman ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                        {entry.playerName}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-xs font-bold ${entry.special ? 'text-amber-700' : 'text-slate-600'}`}>
                      {entry.details}
                    </p>
                  </motion.div>
                )))
              )}
            </div>

            {/* Clear Log Button */}
            <div className="p-4 border-t border-slate-100 shrink-0">
              <p className="text-[10px] text-slate-400 text-center font-mono">
                即時記錄所有戰鬥動作
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

// ─────────────────────────────────────────────
// HandCard Component — Draggable within hand
// ─────────────────────────────────────────────
const HandCard = ({
  card,
  index,
  cardScale,
  isHuman,
  isDiscardMode,
  canInteract,
  getCardConfig,
  onTap,
  onDragToSlot,
  onReorder,
  handLength,
}) => {
  const dragStartIndex = useRef(null);
  const isDraggingInHand = useRef(false);

  const cardW = Math.round(96 * cardScale);
  const cardH = Math.round(128 * cardScale);
  const fontSize = cardScale < 0.8 ? 'text-sm' : cardScale > 1.2 ? 'text-2xl' : 'text-xl';

  return (
    <motion.div
      key={card.id}
      layoutId={card.id}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={canInteract ? { y: -16, scale: 1.08 } : {}}
      whileDrag={{ scale: 1.12, zIndex: 200, cursor: 'grabbing' }}
      drag={canInteract}
      dragSnapToOrigin
      onDragStart={() => {
        isDraggingInHand.current = false;
        dragStartIndex.current = index;
      }}
      onDrag={(e, info) => {
        // Detect if dragging horizontally within hand area (reorder)
        if (Math.abs(info.offset.x) > 20 && Math.abs(info.offset.y) < 60) {
          isDraggingInHand.current = true;
        }
      }}
      onDragEnd={(e, info) => {
        if (isDraggingInHand.current) {
          // Calculate target index based on horizontal offset
          const cardWidthWithGap = cardW + 16;
          const delta = Math.round(info.offset.x / cardWidthWithGap);
          const targetIndex = Math.max(0, Math.min(handLength - 1, index + delta));
          if (targetIndex !== index) {
            onReorder(index, targetIndex);
          }
          isDraggingInHand.current = false;
        } else {
          onDragToSlot(e, info, card);
        }
        dragStartIndex.current = null;
      }}
      onTap={() => onTap(card)}
      style={{ width: cardW, height: cardH, flexShrink: 0 }}
      className={`rounded-2xl border-4 shadow-2xl flex items-center justify-center cursor-pointer relative group
        ${getCardConfig(card).className}
        ${isDiscardMode ? 'ring-4 ring-red-400 ring-offset-2 border-white' : 'border-white'}`}
    >
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors rounded-xl" />
      <span className={`font-black ${fontSize} italic tracking-tighter leading-none text-center px-1`}>
        {getCardConfig(card).display}
      </span>
      <div className="absolute top-1 left-2 text-[8px] font-black opacity-30 uppercase">
        {card.type === 'n' ? 'Num' : 'Word'}
      </div>
      {/* Drag handle indicator */}
      {canInteract && (
        <div className="absolute bottom-1 right-1 opacity-20 group-hover:opacity-50 transition-opacity">
          <GripVertical size={10} />
        </div>
      )}
      {isDiscardMode && isHuman && (
        <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
          <Trash2 className="text-white drop-shadow-lg" size={Math.round(40 * cardScale)} />
        </div>
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// Main App Component
// ─────────────────────────────────────────────
const App = () => {
  const [gameMode, setGameMode] = useState(null);
  const [battleConfig, setBattleConfig] = useState({ difficulty: 'MEDIUM', driver: 'ALGORITHM' });

  const [nDeck, setNDeck] = useState([]);
  const [wDeck, setWDeck] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [slots, setSlots] = useState(Array(10).fill(null));
  const [discardPile, setDiscardPile] = useState([]);
  const [round, setRound] = useState(1);
  const [actionHistory, setActionHistory] = useState([]);

  const [turnPhase, setTurnPhase] = useState('DRAW');
  const [isDiscardMode, setIsDiscardMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Waiting for mission dispatch...');
  const [showWildSelector, setShowWildSelector] = useState(null);
  const [winner, setWinner] = useState(null);
  const [pendingDiscard, setPendingDiscard] = useState(null);
  const [challengeState, setChallengeState] = useState(null);

  // New state for Battle Log visibility and card scale
  const [isBattleLogOpen, setIsBattleLogOpen] = useState(false);
  const [cardScale, setCardScale] = useState(1.0);
  const [contextBlockSize, setContextBlockSize] = useState(24);

  // Context Card state — randomly drawn each round
  const [currentContextCard, setCurrentContextCard] = useState(() => drawContextCard());
  const [isContextCardNew, setIsContextCardNew] = useState(false);

  const slotRefs = useRef(Array(10).fill(null).map(() => React.createRef()));
  const discardRef = useRef(null);
  const isDraggingRef = useRef(false);

  const logAction = useCallback((playerName, isHuman, details, special = false) => {
    setActionHistory(prev => [...prev, {
      playerName,
      isHuman,
      details,
      special,
      timestamp: Date.now()
    }]);
  }, []);

  const startNewGame = (mode, difficulty = 'MEDIUM', driver = 'ALGORITHM') => {
    const newNDeck = generateNDeck();
    const newWDeck = generateWDeck();
    setBattleConfig({ difficulty, driver });

    let initialPlayers = [];
    if (mode === 'PRACTICE') {
      initialPlayers = [
        { id: 1, name: 'Commander You', isHuman: true, hand: [...newNDeck.splice(0, 6), ...newWDeck.splice(0, 6)], score: 0 }
      ];
    } else {
      initialPlayers = [
        { id: 1, name: 'Commander You', isHuman: true, hand: [...newNDeck.splice(0, 6), ...newWDeck.splice(0, 6)], score: 0 },
        { id: 2, name: 'NPC Alpha', isHuman: false, hand: [...newNDeck.splice(0, 6), ...newWDeck.splice(0, 6)], score: 0 },
        { id: 3, name: 'NPC Bravo', isHuman: false, hand: [...newNDeck.splice(0, 6), ...newWDeck.splice(0, 6)], score: 0 },
        { id: 4, name: 'NPC Charlie', isHuman: false, hand: [...newNDeck.splice(0, 6), ...newWDeck.splice(0, 6)], score: 0 }
      ];
    }

    const firstContextCard = drawContextCard();
    setNDeck(newNDeck);
    setWDeck(newWDeck);
    setPlayers(initialPlayers);
    setCurrentPlayerIndex(0);
    setDiscardPile([]);
    setSlots(Array(10).fill(null));
    setTurnPhase('DRAW');
    setStatusMessage('Operation Begun. Supply Line Open. Draw a Card.');
    setGameMode(mode);
    setRound(1);
    setActionHistory([]);
    setCurrentContextCard(firstContextCard);
    setIsContextCardNew(true);
    setTimeout(() => setIsContextCardNew(false), 1500);
    logAction('System', false, `Game Started: ${mode} mode. Context: ${firstContextCard.name} (${firstContextCard.nameEn})`);
  };

  const currentPlayer = players[currentPlayerIndex] || {};

  const drawCard = useCallback((type) => {
    if (turnPhase !== 'DRAW') return;
    if (currentPlayer.isHuman && isLoading) return;

    let newCard;
    if (type === CARD_TYPES.NUMBER) {
      if (nDeck.length === 0) return;
      const newDeck = [...nDeck];
      newCard = newDeck.shift();
      setNDeck(newDeck);
    } else {
      if (wDeck.length === 0) return;
      const newDeck = [...wDeck];
      newCard = newDeck.shift();
      setWDeck(newDeck);
    }

    setPlayers(prev => prev.map((p, i) =>
      i === currentPlayerIndex ? { ...p, hand: [...p.hand, newCard] } : p
    ));
    setTurnPhase('ACTION');

    const logDetails = currentPlayer.isHuman
      ? `抽取了 ${newCard.type === 'n' ? '數字卡' : '單字卡'}: [${newCard.label || newCard.value}]`
      : `抽取了 ${newCard.type === 'n' ? '數字卡' : '單字卡'}`;
    logAction(currentPlayer.name, currentPlayer.isHuman, logDetails);

    if (currentPlayer.isHuman) {
      setStatusMessage('Action Phase: Build your equation or Discard to end turn.');
    }
  }, [turnPhase, currentPlayerIndex, currentPlayer.isHuman, currentPlayer.name, isLoading, nDeck, wDeck, logAction]);

  const replenishAllHands = useCallback(() => {
    setPlayers(prev => {
      let currentNDeck = [...nDeck];
      let currentWDeck = [...wDeck];

      const newPlayers = prev.map(player => {
        const numToDrawN = Math.max(0, 6 - player.hand.filter(c => c.type === CARD_TYPES.NUMBER).length);
        const numToDrawW = Math.max(0, 6 - player.hand.filter(c => c.type === CARD_TYPES.WORD).length);
        const cardsN = currentNDeck.splice(0, numToDrawN);
        const cardsW = currentWDeck.splice(0, numToDrawW);
        return { ...player, hand: [...player.hand, ...cardsN, ...cardsW] };
      });

      setNDeck(currentNDeck);
      setWDeck(currentWDeck);
      return newPlayers;
    });
    logAction('System', false, 'All players have replenished their hands to operational levels.');
  }, [nDeck, wDeck, logAction]);

  const resetRound = useCallback(() => {
    const newNDeck = generateNDeck();
    const newWDeck = generateWDeck();

    setPlayers(prev => prev.map(p => ({
      ...p,
      hand: [...newNDeck.splice(0, 6), ...newWDeck.splice(0, 6)]
    })));

    setNDeck(newNDeck);
    setWDeck(newWDeck);
    setSlots(Array(10).fill(null));
    setTurnPhase('DRAW');
    setIsDiscardMode(false);
    setPendingDiscard(null);
    setChallengeState(null);

    // Draw a new context card each round
    setCurrentContextCard(prev => {
      const next = drawContextCard(prev?.id);
      setIsContextCardNew(true);
      setTimeout(() => setIsContextCardNew(false), 1500);
      logAction('System', false, `新情境地圖! 抽到: ${next.name} (${next.nameEn})`, true);
      return next;
    });

    logAction('System', false, 'Round Reset! All cards collected and supply lines redistributed.', true);
    setStatusMessage('Operation Reset. Supply Line Refreshed. Draw a Card.');
  }, [logAction]);

  const endTurn = useCallback((skipReturn = false, slotsToReturn = null, forceNext = false) => {
    const activeSlots = slotsToReturn || slots;
    const cardsInSlots = activeSlots.filter(s => s !== null);

    if (!skipReturn && cardsInSlots.length > 0) {
      setPlayers(prev => prev.map((p, i) =>
        i === currentPlayerIndex ? { ...p, hand: [...p.hand, ...cardsInSlots] } : p
      ));
      logAction('System', false, `Turn End: All construction cards returned to ${players[currentPlayerIndex]?.name}'s hand.`);
    }

    setSlots(Array(10).fill(null));
    setTurnPhase('END');
    setIsDiscardMode(false);
    setPendingDiscard(null);

    setTimeout(() => {
      if (gameMode === 'BATTLE') {
        const nextIndex = (currentPlayerIndex + 1) % players.length;
        if (nextIndex === 0) setRound(r => r + 1);
        setCurrentPlayerIndex(nextIndex);
        setTurnPhase('DRAW');
        const nextPlayer = players[nextIndex];
        if (nextPlayer) {
          setStatusMessage(nextPlayer.isHuman ? 'Your Turn: Supply Line Open. Draw a Card.' : `${nextPlayer.name}'s turn...`);
        }
      } else {
        setRound(r => r + 1);
        setTurnPhase('DRAW');
        setStatusMessage('Your Turn: Supply Line Open. Draw a Card.');
      }
    }, 1500);
  }, [gameMode, currentPlayerIndex, players, slots, logAction]);

  const initiateDiscard = (card) => {
    setPendingDiscard({ card, sourcePlayerIndex: currentPlayerIndex });
    setTurnPhase('ROBBING');
    setStatusMessage('ROBBABLE! Opportunity to sieze supply!');

    setPlayers(prev => prev.map((p, i) =>
      i === currentPlayerIndex ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p
    ));
    setDiscardPile(prev => [card, ...prev]);
    logAction(currentPlayer.name, currentPlayerIndex === 0, `棄置了卡牌: [${card.label || card.value}]`, false, true);

    setTimeout(() => {
      setTurnPhase(prev => {
        if (prev === 'ROBBING') {
          endTurn(true, [], true);
          return 'END';
        }
        return prev;
      });
    }, 2500);
  };

  const handleRob = () => {
    if (turnPhase !== 'ROBBING' || !pendingDiscard) return;
    const robberIndex = 0;

    setTurnPhase('ACTION');
    setPlayers(prev => prev.map((p, i) =>
      i === robberIndex ? { ...p, hand: [...p.hand, pendingDiscard.card] } : p
    ));
    setDiscardPile(prev => prev.slice(1));
    setStatusMessage(`ROBBED! Commander You seized the supply!`);
    logAction('Commander You', true, `突襲 (ROBBED) 了 [${pendingDiscard.card.label || pendingDiscard.card.value}]!`, true);
    setPendingDiscard(null);
    setCurrentPlayerIndex(robberIndex);
    setTurnPhase('ACTION');
  };

  const handlePercentBattle = useCallback(async (providedSlots = null) => {
    const activeSlots = Array.isArray(providedSlots) ? providedSlots : slots;
    const activeCards = activeSlots.filter(s => s !== null);
    if (activeCards.length === 0) return;

    setIsLoading(true);
    setStatusMessage('AI Judge is calculating strategy...');
    const sentence = activeSlots.map(s => s?.label || s?.value).filter(Boolean).join(' ');

    logAction(currentPlayer.name, currentPlayer.isHuman, `發起了 PERCENT BATTLE! 提交句子: "${sentence}"`);

    // Build context data from current context card
    const contextData = buildContextData(currentContextCard);

    try {
      const result = await judgeSubmission(sentence, contextData);

      if (result.isValid) {
        if (result.strategy === 'B') {
          setChallengeState({ challengerIndex: currentPlayerIndex, timer: 5, activeSlots: activeSlots });
          setTurnPhase('CHALLENGE');
          setStatusMessage('TACTICS B! Challenge Mode Initiated!');
          logAction(currentPlayer.name, currentPlayer.isHuman, `成功佈下陷阱 (TACTICS B)! 所有人請搶答!`, true);
          return;
        }

        setPlayers(prev => prev.map((p, i) =>
          i === currentPlayerIndex ? { ...p, score: p.score + activeCards.length } : p
        ));
        setStatusMessage(`VICTORY! ${result.feedback}`);
        logAction('Judge', false, `✅ 判定有效! (${result.strategy}) 獲得 ${activeCards.length} 分。回饋: ${result.feedback}`, true);

        const newScore = players[currentPlayerIndex].score + activeCards.length;
        if (newScore >= 50) {
          setWinner(players[currentPlayerIndex]);
          setTurnPhase('GAME_OVER');
          return;
        }

        setTimeout(() => {
          resetRound();
          const nextIndex = (currentPlayerIndex + 1) % players.length;
          setCurrentPlayerIndex(nextIndex);
        }, 2500);
      } else {
        setPlayers(prev => prev.map((p, i) =>
          i === currentPlayerIndex ? { ...p, score: Math.max(0, p.score - 10) } : p
        ));
        setStatusMessage(`DEFEAT! ${result.feedback}`);
        logAction('Judge', false, `❌ 判定無效! (${currentPlayer.name}) 扣除 10 分。卡牌已收回手牌。回饋: ${result.feedback}`);
        setTimeout(() => {
          endTurn(false, activeSlots);
        }, 2500);
      }
    } catch (error) {
      console.error("Battle Error:", error);
      setStatusMessage('Communication Error: Supply line interrupted.');
      logAction('System', false, `Battle Error: ${error.message}. Ending turn to avoid freeze.`);
      setTimeout(() => {
        endTurn(false, activeSlots);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  }, [slots, currentPlayer.name, currentPlayer.isHuman, currentPlayerIndex, logAction, replenishAllHands, endTurn]);

  const moveHandToSlot = (card, targetIndex = -1) => {
    if (!currentPlayer.isHuman || turnPhase !== 'ACTION') return;
    if (targetIndex === -1 && isDraggingRef.current) return;
    if (isDiscardMode) {
      initiateDiscard(card);
      return;
    }

    if (targetIndex !== -1 && slots[targetIndex] === null) {
      if (card.value === 'Wild') {
        setShowWildSelector({ card, slotIndex: targetIndex });
        return;
      }
      const newSlots = [...slots];
      newSlots[targetIndex] = card;
      setSlots(newSlots);
      setPlayers(prev => prev.map((p, i) =>
        i === currentPlayerIndex ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p
      ));
      logAction(currentPlayer.name, true, `將 [${card.label || card.value}] 移至空格 ${targetIndex + 1}`);
      return;
    }

    const emptySlotIndex = slots.findIndex(slot => slot === null);
    if (emptySlotIndex !== -1) {
      if (card.value === 'Wild') {
        setShowWildSelector({ card, slotIndex: emptySlotIndex });
        return;
      }
      const newSlots = [...slots];
      newSlots[emptySlotIndex] = card;
      setSlots(newSlots);
      setPlayers(prev => prev.map((p, i) =>
        i === currentPlayerIndex ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p
      ));
      logAction(currentPlayer.name, true, `將 [${card.label || card.value}] 移至空格 ${emptySlotIndex + 1}`);
    }
  };

  // Reorder hand cards by drag within hand area
  const reorderHand = useCallback((fromIndex, toIndex) => {
    setPlayers(prev => prev.map((p, i) => {
      if (!p.isHuman) return p;
      const newHand = [...p.hand];
      const [moved] = newHand.splice(fromIndex, 1);
      newHand.splice(toIndex, 0, moved);
      return { ...p, hand: newHand };
    }));
    logAction('Commander You', true, `重新排列了手牌順序`);
  }, [logAction]);

  const handleWildSelect = (value) => {
    if (!showWildSelector) return;
    const { card, slotIndex } = showWildSelector;
    const newCard = { ...card, label: value, isWild: true };

    const newSlots = [...slots];
    newSlots[slotIndex] = newCard;
    setSlots(newSlots);
    setPlayers(prev => prev.map((p, i) =>
      i === currentPlayerIndex ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p
    ));
    logAction(currentPlayer.name, true, `使用了百搭卡! 設定為: [${value}]`);
    setShowWildSelector(null);
  };

  const moveSlotToHand = (card, index) => {
    if (!currentPlayer.isHuman || turnPhase !== 'ACTION') return;
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
    setPlayers(prev => prev.map((p, i) =>
      i === currentPlayerIndex ? { ...p, hand: [...p.hand, card] } : p
    ));
    logAction(currentPlayer.name, true, `將 [${card.label || card.value}] 從空格 ${index + 1} 收回手牌`);
  };

  const toggleDiscardMode = () => {
    if (turnPhase === 'ACTION' && currentPlayer.isHuman) {
      setIsDiscardMode(!isDiscardMode);
      setStatusMessage(isDiscardMode
        ? 'Action Phase: Build your equation or Discard to end turn.'
        : 'DISCARD MODE: Select a card from your hand to discard and END TURN.');
    }
  };

  const handleDragEnd = (event, info, card) => {
    if (!currentPlayer.isHuman || turnPhase !== 'ACTION') return;

    if (discardRef.current) {
      const dRect = discardRef.current.getBoundingClientRect();
      if (
        info.point.x >= dRect.left && info.point.x <= dRect.right &&
        info.point.y >= dRect.top && info.point.y <= dRect.bottom
      ) {
        initiateDiscard(card);
        return;
      }
    }

    for (let i = 0; i < slotRefs.current.length; i++) {
      const slotEl = slotRefs.current[i];
      if (slotEl && slots[i] === null) {
        const sRect = slotEl.getBoundingClientRect();
        if (
          info.point.x >= sRect.left && info.point.x <= sRect.right &&
          info.point.y >= sRect.top && info.point.y <= sRect.bottom
        ) {
          moveHandToSlot(card, i);
          return;
        }
      }
    }
  };

  // Challenge Timer Effect
  useEffect(() => {
    let interval;
    if (turnPhase === 'CHALLENGE' && challengeState && challengeState.timer > 0) {
      interval = setInterval(() => {
        setChallengeState(prev => {
          if (prev.timer <= 1) {
            clearInterval(interval);
            setTurnPhase('ACTION');
            const points = prev.activeSlots.filter(s => s !== null).length;
            setPlayers(oldPlayers => oldPlayers.map((p, i) =>
              i === prev.challengerIndex ? { ...p, score: p.score + points } : p
            ));
            setStatusMessage(`Challenge Timeout! ${players[prev.challengerIndex].name} gets points!`);
            logAction('System', false, `無人搶答! 發起者獲得 ${points} 分。`, true);

            if (players[prev.challengerIndex].score + points >= 50) {
              setWinner(players[prev.challengerIndex]);
              setTurnPhase('GAME_OVER');
            } else {
              setTimeout(() => {
                resetRound();
                const nextIndex = (prev.challengerIndex + 1) % players.length;
                setCurrentPlayerIndex(nextIndex);
              }, 2000);
            }
            return { ...prev, timer: 0 };
          }
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [turnPhase, challengeState, players, endTurn, logAction]);

  const handleBuzzIn = () => {
    if (turnPhase !== 'CHALLENGE' || !challengeState) return;
    const points = 5;
    setPlayers(prev => prev.map((p, i) =>
      i === 0 ? { ...p, score: p.score + points } : p
    ));
    setStatusMessage('BUZZ IN! Commander You answered correctly!');
    logAction('Commander You', true, `成功搶答! 獲得 ${points} 分!`, true);
    setTurnPhase('ACTION');
    setChallengeState(null);
    setTimeout(() => {
      resetRound();
      setCurrentPlayerIndex(0);
    }, 2000);
  };

  // AI Turn Logic: Drawing Phase
  useEffect(() => {
    let isCancelled = false;
    if (gameMode === 'BATTLE' && currentPlayer && !currentPlayer.isHuman && turnPhase === 'DRAW') {
      const delay = battleConfig.difficulty === 'LOW' ? 2200 : battleConfig.difficulty === 'HIGH' ? 800 : 1500;
      const timer = setTimeout(() => {
        if (isCancelled) return;
        const type = Math.random() > 0.5 ? CARD_TYPES.NUMBER : CARD_TYPES.WORD;
        drawCard(type);
      }, delay);
      return () => { isCancelled = true; clearTimeout(timer); };
    }
  }, [gameMode, currentPlayerIndex, turnPhase, battleConfig.difficulty, drawCard, currentPlayer?.isHuman]);

  const npcProcessingRef = useRef({ turnIndex: -1, phase: '', round: -1 });

  useEffect(() => {
    if (turnPhase === 'DRAW') {
      npcProcessingRef.current = { turnIndex: -1, phase: '', round: -1 };
    }
  }, [turnPhase]);

  useEffect(() => {
    let isCancelled = false;
    if (gameMode === 'BATTLE' && currentPlayer && !currentPlayer.isHuman && turnPhase === 'ACTION') {
      if (
        npcProcessingRef.current.turnIndex === currentPlayerIndex &&
        npcProcessingRef.current.phase === 'ACTION' &&
        npcProcessingRef.current.round === round
      ) {
        return;
      }

      const executeMove = async () => {
        npcProcessingRef.current = { turnIndex: currentPlayerIndex, phase: 'ACTION', round: round };
        const delay = battleConfig.difficulty === 'LOW' ? 2200 : battleConfig.difficulty === 'HIGH' ? 800 : 1500;

        try {
          if (battleConfig.driver === 'AI') {
            setStatusMessage(`${currentPlayer.name} is analyzing strategy...`);
            const move = await getNpcMove(currentPlayer.hand, contextData, battleConfig.difficulty);

            if (isCancelled && (turnPhase !== 'ACTION' || currentPlayerIndex !== npcProcessingRef.current.turnIndex)) return;

            if (move.action === 'BATTLE' && move.cardIndices?.length > 0) {
              const chosenCards = move.cardIndices.map(idx => currentPlayer.hand[idx]).filter(Boolean);
              if (chosenCards.length > 0) {
                const newSlots = [...slots];
                chosenCards.forEach((card, i) => {
                  if (i < 10) {
                    if (card.value === 'Wild' && move.wildValues && move.wildValues[i.toString()]) {
                      newSlots[i] = { ...card, label: move.wildValues[i.toString()], isWild: true };
                    } else {
                      newSlots[i] = card;
                    }
                  }
                });
                setSlots(newSlots);
                setPlayers(prev => prev.map((p, i) =>
                  i === currentPlayerIndex ? { ...p, hand: p.hand.filter(c => !chosenCards.find(cc => cc.id === c.id)) } : p
                ));
                logAction(currentPlayer.name, false, `使用了 AI 策略進行 PERCENT BATTLE! 提交: "${newSlots.filter(Boolean).map(c => c.label || c.value).join(' ')}"`);
                setTimeout(() => { handlePercentBattle(newSlots); }, 1000);
                return;
              }
            }

            const discardIdx = (move.cardIndices && move.cardIndices[0] !== undefined) ? move.cardIndices[0] : 0;
            const cardToDiscard = currentPlayer.hand[discardIdx] || currentPlayer.hand[0];
            if (cardToDiscard) {
              initiateDiscard(cardToDiscard);
            } else {
              endTurn();
            }
          } else {
            const timer = setTimeout(() => {
              if (isCancelled && (turnPhase !== 'ACTION' || currentPlayerIndex !== npcProcessingRef.current.turnIndex)) return;
              const npcHand = [...currentPlayer.hand];
              if (npcHand.length > 0) {
                const randomIndex = Math.floor(Math.random() * npcHand.length);
                const cardToDiscard = npcHand[randomIndex];
                initiateDiscard(cardToDiscard);
              } else {
                endTurn();
              }
            }, delay);
          }
        } catch (error) {
          console.error("NPC Move Error:", error);
          logAction(currentPlayer.name, false, "遭遇系統干擾，強制結束回合。");
          endTurn();
        }
      };

      executeMove();
      return () => { isCancelled = true; };
    }
  }, [gameMode, currentPlayerIndex, turnPhase, round, battleConfig.difficulty, battleConfig.driver, endTurn, logAction, currentPlayer?.isHuman, currentPlayer?.hand, handlePercentBattle]);

  const getCardConfig = (card) => {
    if (!card) return {};
    if (card.type === CARD_TYPES.NUMBER) return { className: 'bg-card-n border-white/30 text-white', display: card.label || card.value };
    if (card.value === 'red') return { className: 'bg-red-50 border-red-400 text-red-700', display: card.label };
    if (card.value === 'yellow') return { className: 'bg-amber-50 border-amber-400 text-amber-700', display: card.label };
    if (card.value === 'blue') return { className: 'bg-blue-50 border-blue-400 text-blue-700', display: card.label };
    return { className: 'bg-card-w border-white/30 text-white', display: card.label || card.value };
  };

  // Card scale limits
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 1.6;
  const SCALE_STEP = 0.1;

  const humanHand = players.find(p => p.isHuman)?.hand || [];
  const footerHeight = Math.round(128 * cardScale) + 32; // card height + padding

  try {
    if (!gameMode) return <StartMenu onSelectMode={(m) => startNewGame(m)} onStartBattle={(d, dr) => startNewGame('BATTLE', d, dr)} />;

    return (
      <div className="h-screen w-full bg-bg-light overflow-hidden flex flex-col text-slate-800 font-sans relative">
        {showWildSelector && (
          <WildCardSelector
            type={showWildSelector.card.type}
            onSelect={handleWildSelect}
            onCancel={() => setShowWildSelector(null)}
          />
        )}

        {winner && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-10 rounded-3xl text-center border-8 border-amber-400 shadow-[0_0_100px_rgba(251,191,36,0.5)]"
            >
              <Trophy size={80} className="mx-auto text-amber-500 mb-6 animate-bounce" />
              <h1 className="text-5xl font-black text-slate-800 mb-2">VICTORY!</h1>
              <p className="text-xl font-bold text-slate-500 mb-8">{winner.name} is the Commander!</p>
              <div className="text-4xl font-black text-indigo-600 mb-8">{winner.score} PTS</div>
              <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600">
                Play Again
              </button>
            </motion.div>
          </div>
        )}

        {turnPhase === 'ROBBING' && pendingDiscard && pendingDiscard.sourcePlayerIndex !== 0 && (
          <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1.5, rotate: 0 }}
              className="bg-amber-500 text-white font-black text-4xl px-8 py-4 rounded-3xl shadow-xl border-4 border-white rotate-[-5deg] mb-8"
            >
              ROBBABLE!
            </motion.div>
            <div className="pointer-events-auto">
              <button
                onClick={handleRob}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl px-12 py-6 rounded-2xl shadow-2xl border-4 border-indigo-300 active:scale-95 transition-transform animate-pulse"
              >
                ROB CARD (突襲)!
              </button>
            </div>
          </div>
        )}

        {turnPhase === 'CHALLENGE' && challengeState && (
          <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-8xl font-black text-white mb-8 animate-pulse">{challengeState.timer}</div>
            <div className="bg-white p-8 rounded-3xl text-center max-w-lg">
              <h2 className="text-2xl font-black text-slate-800 mb-4">TACTICS B INITIATED!</h2>
              <p className="text-slate-600 mb-8">Click "BUZZ IN" to answer the question!</p>
              <button
                onClick={handleBuzzIn}
                className="w-full py-6 bg-rose-500 hover:bg-rose-600 text-white font-black text-3xl rounded-2xl shadow-xl transition-transform active:scale-95"
              >
                BUZZ IN!
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
            {players.map((player, idx) => (
              <div key={player.id} className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl transition-all duration-300 border-2 
              ${currentPlayerIndex === idx ? 'bg-indigo-50 border-indigo-500 scale-105 shadow-md' : 'bg-slate-50 border-transparent opacity-60'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                ${player.isHuman ? 'bg-blue-500 border-blue-200' : 'bg-slate-400 border-slate-300'}`}
                >
                  {player.isHuman ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                </div>
                <div className="shrink-0">
                  <div className="text-[10px] font-black uppercase text-slate-400 leading-none">P{idx + 1}</div>
                  <div className="text-xs font-bold text-slate-700 truncate max-w-[80px]">{player.name}</div>
                  <div className="text-[10px] font-black text-indigo-600">SCORE: {player.score}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 mx-8 flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={statusMessage}
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                className={`px-6 py-2 rounded-full border shadow-sm font-bold text-sm flex items-center gap-2
                ${turnPhase === 'DRAW' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                    turnPhase === 'ACTION' ? (isDiscardMode ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700') :
                      'bg-slate-100 text-slate-500'}
              `}
              >
                {currentPlayer && !currentPlayer.isHuman && <Bot size={16} className="animate-pulse" />}
                {statusMessage}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-100 px-3 py-1 rounded-lg text-center border border-slate-200 flex flex-col items-center">
              <div className="flex gap-1">
                {battleConfig.difficulty === 'HIGH' && <Zap size={10} className="text-rose-500" />}
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Round</span>
              </div>
              <div className="text-lg font-black text-slate-700">{round}</div>
            </div>
            <button onClick={() => setGameMode(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
              <RotateCcw size={20} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 flex overflow-hidden relative">

              {/* Left Sidebar */}
              <aside className="w-64 border-r border-slate-200 bg-white p-6 flex flex-col gap-6 shrink-0 z-0 overflow-y-auto no-scrollbar">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Supply Decks {turnPhase === 'DRAW' && currentPlayer.isHuman && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />}
                  </h3>
                  <div className="flex gap-4">
                    {[{ type: CARD_TYPES.NUMBER, label: 'N', deck: nDeck, color: 'bg-card-n' }, { type: CARD_TYPES.WORD, label: 'W', deck: wDeck, color: 'bg-card-w' }].map(d => (
                      <button
                        key={d.label} onClick={() => drawCard(d.type)}
                        disabled={turnPhase !== 'DRAW' || !currentPlayer.isHuman}
                        className={`flex-1 aspect-[3/4] ${d.color} rounded-xl shadow-lg border-2 border-white/20 flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-300
                        ${turnPhase === 'DRAW' && currentPlayer.isHuman ? 'cursor-pointer hover:-translate-y-2 hover:shadow-xl ring-4 ring-indigo-500/20' : 'opacity-80 grayscale-[0.3] cursor-not-allowed'}
                      `}
                      >
                        <span className="text-2xl font-black text-white italic">{d.label}</span>
                        <div className="absolute bottom-1 right-1 bg-black/20 px-1 py-0.5 rounded text-[8px] font-bold text-white">{d.deck.length}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Discard</h3>
                  <div
                    ref={discardRef}
                    onClick={() => toggleDiscardMode()}
                    className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 relative
                    ${isDiscardMode ? 'bg-red-50 border-red-500 animate-pulse cursor-pointer' :
                        turnPhase === 'ACTION' && currentPlayer.isHuman ? 'bg-slate-100 border-slate-300 hover:border-slate-400 cursor-pointer' : 'bg-slate-50 border-slate-200 cursor-not-allowed'}
                  `}
                  >
                    {discardPile.length > 0 ? (
                      <div className="w-full h-full p-2 relative">
                        <div className={`w-full h-full rounded-lg flex items-center justify-center shadow-md font-bold text-base border-2 ${getCardConfig(discardPile[0]).className}`}>
                          {getCardConfig(discardPile[0]).display}
                        </div>
                      </div>
                    ) : <Trash2 size={32} className={isDiscardMode ? "text-red-500" : "text-slate-400"} />}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <button
                    onClick={handlePercentBattle}
                    disabled={isLoading || slots.every(s => s === null) || (gameMode === 'BATTLE' && !currentPlayer.isHuman)}
                    className={`w-full py-4 px-6 rounded-xl font-black text-lg transition-all duration-300 uppercase tracking-tighter shadow-lg
                    ${slots.some(s => s !== null) && !isLoading && (gameMode === 'PRACTICE' || currentPlayer.isHuman)
                        ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}
                  `}
                  >
                    {isLoading ? 'Wait...' : 'Percent Battle!'}
                  </button>
                </div>
              </aside>

              {/* Main Game Area */}
              <main className="flex-1 flex flex-col gap-8 p-8 overflow-y-auto bg-slate-50/50 relative">
                {/* Context Card — Dynamic, randomly drawn each round */}
                <section className="flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentContextCard.id}
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.4 }}
                      className={`w-full max-w-2xl bg-white p-6 rounded-3xl shadow-xl border-2 relative overflow-hidden text-center transition-all duration-500
                        ${isContextCardNew ? 'border-amber-400 shadow-amber-200/50 shadow-2xl' : 'border-slate-200'}`}
                    >
                      {/* NEW badge */}
                      {isContextCardNew && (
                        <motion.div
                          initial={{ scale: 0, rotate: -15 }}
                          animate={{ scale: 1, rotate: -5 }}
                          exit={{ scale: 0 }}
                          className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10"
                        >
                          NEW MAP!
                        </motion.div>
                      )}

                      {/* Card header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Layers size={16} className="text-indigo-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">情境地圖 Context Map</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-300">基數 {currentContextCard.base}</span>
                          {currentContextCard.hint && (
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              ⚠ {currentContextCard.hint}
                            </span>
                          )}
                          {/* Refresh / Re-draw button */}
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92, rotate: 180 }}
                            onClick={() => {
                              setCurrentContextCard(prev => {
                                const next = drawContextCard(prev?.id);
                                setIsContextCardNew(true);
                                setTimeout(() => setIsContextCardNew(false), 1500);
                                logAction('System', false, `學生手動换牌! 新情境: ${next.name} (${next.nameEn})`, true);
                                return next;
                              });
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-400 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wide transition-all duration-200 shadow-sm hover:shadow-md"
                            title="重新抽取情境牌"
                          >
                            <Shuffle size={11} />
                            <span>換張牌</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Card name + zoom controls */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-left">
                          <h2 className="text-xl font-black text-slate-800 tracking-tight">{currentContextCard.name}</h2>
                          <p className="text-xs text-slate-400 font-bold italic">{currentContextCard.nameEn} — {currentContextCard.description}</p>
                        </div>
                        {/* Block size zoom controls */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setContextBlockSize(s => Math.max(12, s - 4))}
                            disabled={contextBlockSize <= 12}
                            className="w-7 h-7 rounded-full font-black text-base flex items-center justify-center border-2 transition-all select-none"
                            style={{
                              background: contextBlockSize <= 12 ? '#f1f5f9' : '#eff6ff',
                              borderColor: contextBlockSize <= 12 ? '#cbd5e1' : '#bfdbfe',
                              color: contextBlockSize <= 12 ? '#94a3b8' : '#3b82f6',
                              cursor: contextBlockSize <= 12 ? 'not-allowed' : 'pointer',
                            }}
                          >−</button>
                          <span className="text-[10px] font-bold text-slate-400 w-6 text-center">{contextBlockSize}</span>
                          <button
                            onClick={() => setContextBlockSize(s => Math.min(48, s + 4))}
                            disabled={contextBlockSize >= 48}
                            className="w-7 h-7 rounded-full font-black text-base flex items-center justify-center border-2 transition-all select-none"
                            style={{
                              background: contextBlockSize >= 48 ? '#f1f5f9' : '#eff6ff',
                              borderColor: contextBlockSize >= 48 ? '#cbd5e1' : '#bfdbfe',
                              color: contextBlockSize >= 48 ? '#94a3b8' : '#3b82f6',
                              cursor: contextBlockSize >= 48 ? 'not-allowed' : 'pointer',
                            }}
                          >+</button>
                        </div>
                      </div>

                      {/* Color block grid — 5 rows per column, students count themselves */}
                      <div className="w-full overflow-x-auto pb-1">
                        <div className="flex items-start justify-center flex-nowrap" style={{ gap: '16px' }}>
                          {currentContextCard.segments.map(seg => {
                            const ROWS = 5;
                            const totalCols = Math.ceil(seg.value / ROWS);
                            return (
                              <div key={seg.key} className="flex flex-col items-center flex-shrink-0" style={{ gap: '6px' }}>
                                {/* Color label pill */}
                                <div
                                  className="rounded-full border font-black px-3 py-0.5 whitespace-nowrap"
                                  style={{
                                    background: seg.key === 'red' ? '#fff1f0' : seg.key === 'yellow' ? '#fffbeb' : '#eff6ff',
                                    borderColor: seg.key === 'red' ? '#fca5a5' : seg.key === 'yellow' ? '#fcd34d' : '#93c5fd',
                                    color: seg.key === 'red' ? '#dc2626' : seg.key === 'yellow' ? '#d97706' : '#2563eb',
                                    fontSize: `${Math.max(10, Math.min(14, contextBlockSize * 0.5))}px`,
                                  }}
                                >
                                  {seg.label}
                                </div>
                                {/* Block columns */}
                                <div className="flex items-start" style={{ gap: '4px' }}>
                                  {Array.from({ length: totalCols }, (_, colIdx) => (
                                    <div key={colIdx} className="flex flex-col" style={{ gap: '4px' }}>
                                      {Array.from({ length: ROWS }, (_, rowIdx) => {
                                        const blockIdx = colIdx * ROWS + rowIdx;
                                        const filled = blockIdx < seg.value;
                                        return (
                                          <div
                                            key={rowIdx}
                                            className="rounded-md"
                                            style={{
                                              width: `${contextBlockSize}px`,
                                              height: `${contextBlockSize}px`,
                                              backgroundColor: filled ? seg.barColor : 'transparent',
                                              border: filled ? `2px solid ${seg.barColor}99` : 'none',
                                              visibility: filled ? 'visible' : 'hidden',
                                              boxShadow: filled ? `0 2px 4px ${seg.barColor}40` : 'none',
                                            }}
                                          />
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Counting hint */}
                      <p className="text-[10px] text-slate-400 italic mt-3 mb-1">
                        每直行有 5 格，請自己數一數各顏色有幾格！
                      </p>

                      {/* Note / hint badge */}
                      {currentContextCard.hint && (
                        <div className="mt-2 rounded-lg px-3 py-1.5 border" style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
                          <p className="text-xs font-bold" style={{ color: '#d97706' }}>💡 {currentContextCard.hint}</p>
                        </div>
                      )}

                      {/* Context card deck indicator */}
                      <div className="mt-3 flex items-center justify-center gap-2">
                        {CONTEXT_CARDS.map(c => (
                          <div
                            key={c.id}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              c.id === currentContextCard.id ? 'bg-indigo-500 scale-150' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </section>

                {/* Combat Construction Zone */}
                <section className="flex flex-col items-center flex-1 justify-center min-h-[300px]">
                  <div className="mb-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center mb-4">
                      <Target className="text-amber-500" size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Combat Construction Zone</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Assemble your mathematical strike</p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 w-full max-w-4xl">
                    {slots.map((card, index) => (
                      <div
                        key={index}
                        ref={el => slotRefs.current[index] = el}
                        className={`w-16 h-20 rounded-xl border-2 border-dashed flex items-center justify-center transition-all duration-300
                      ${card ? 'border-transparent' : 'border-slate-300 bg-white/40 hover:bg-white cursor-pointer'}`}
                      >
                        <AnimatePresence mode="popLayout">
                          {card && (
                            <motion.div
                              layoutId={card.id} onClick={() => moveSlotToHand(card, index)}
                              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                              className={`w-full h-full rounded-xl border-2 shadow-sm flex items-center justify-center cursor-pointer hover:brightness-105 active:scale-95 transition-all ${getCardConfig(card).className}`}
                            >
                              <span className="font-black text-sm italic">{getCardConfig(card).display}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                  {isDiscardMode && <div className="mt-8 bg-red-500 text-white text-[10px] font-black px-6 py-2 rounded-full animate-bounce shadow-xl">Select a card from hand to Discard</div>}
                </section>
              </main>
            </div>

            {/* ─── Hand Area (Footer) ─── */}
            <footer
              className={`bg-white border-t border-slate-200 px-4 py-3 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] transition-all duration-500 z-50
              ${!currentPlayer.isHuman ? 'bg-slate-50' : isDiscardMode ? 'bg-red-50' : ''}`}
              style={{ minHeight: footerHeight + 'px' }}
            >
              {/* Scale Controls + Label */}
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">手牌區</span>
                  <span className="text-[10px] text-slate-300 font-mono ml-2">({humanHand.length} 張)</span>
                  {currentPlayer.isHuman && turnPhase === 'ACTION' && (
                    <span className="text-[9px] text-slate-300 ml-2 italic">拖曳卡牌可重新排列順序</span>
                  )}
                </div>
                {/* Card Scale Slider */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCardScale(s => Math.max(MIN_SCALE, parseFloat((s - SCALE_STEP).toFixed(1))))}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-30"
                    disabled={cardScale <= MIN_SCALE}
                    title="縮小卡牌"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <input
                    type="range"
                    min={MIN_SCALE}
                    max={MAX_SCALE}
                    step={SCALE_STEP}
                    value={cardScale}
                    onChange={e => setCardScale(parseFloat(e.target.value))}
                    className="w-24 h-1.5 accent-indigo-500 cursor-pointer"
                    title={`卡牌大小: ${Math.round(cardScale * 100)}%`}
                  />
                  <button
                    onClick={() => setCardScale(s => Math.min(MAX_SCALE, parseFloat((s + SCALE_STEP).toFixed(1))))}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-30"
                    disabled={cardScale >= MAX_SCALE}
                    title="放大卡牌"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <span className="text-[10px] font-mono text-slate-300 w-8 text-right">{Math.round(cardScale * 100)}%</span>
                </div>
              </div>

              {/* Hand Cards */}
              <div
                className={`flex items-end overflow-x-auto overflow-y-visible no-scrollbar gap-3 px-2 pb-1 transition-opacity duration-500
                ${!currentPlayer.isHuman ? 'opacity-60 pointer-events-none grayscale-[0.2]' : ''}`}
                style={{ minHeight: Math.round(128 * cardScale) + 'px' }}
              >
                <AnimatePresence>
                  {humanHand.map((card, index) => (
                    <HandCard
                      key={card.id}
                      card={card}
                      index={index}
                      cardScale={cardScale}
                      isHuman={currentPlayer.isHuman}
                      isDiscardMode={isDiscardMode}
                      canInteract={currentPlayer.isHuman && turnPhase === 'ACTION' && !isLoading}
                      getCardConfig={getCardConfig}
                      onTap={moveHandToSlot}
                      onDragToSlot={handleDragEnd}
                      onReorder={reorderHand}
                      handLength={humanHand.length}
                    />
                  ))}
                </AnimatePresence>
                {humanHand.length === 0 && (
                  <div className="w-full text-center text-slate-300 font-black uppercase tracking-widest italic py-4">
                    Out of Cards
                  </div>
                )}
              </div>
            </footer>
          </div>
        </div>

        {/* Battle Log — Collapsible Side Panel */}
        <BattleLog
          history={actionHistory}
          isOpen={isBattleLogOpen}
          onToggle={() => setIsBattleLogOpen(o => !o)}
        />

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
          input[type=range]::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: #e2e8f0; }
          input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #6366f1; margin-top: -4px; cursor: pointer; }
          input[type=range]::-moz-range-track { height: 6px; border-radius: 3px; background: #e2e8f0; }
          input[type=range]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #6366f1; border: none; cursor: pointer; }
        `}</style>
      </div>
    );
  } catch (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-rose-50 p-10">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-rose-200 text-center">
          <h1 className="text-2xl font-black text-rose-600 mb-4">CRITICAL RENDER ERROR</h1>
          <p className="text-slate-600 font-mono text-sm break-all">{error.message}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-rose-500 text-white rounded-xl font-bold">RELOAD MISSION</button>
        </div>
      </div>
    );
  }
};

export default App;
