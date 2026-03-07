/**
 * Multi-device Room Battle page.
 * - Host: sets a 3-digit room code and waits for players
 * - Guest: enters room code to join
 * - Up to 4 players per room
 * - Uses Socket.io for real-time sync
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { io, Socket } from "socket.io-client";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, Crown, CheckCircle2, Circle, Sword, LogOut,
  Send, Copy, Check, Play, ArrowLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoomPlayer {
  socketId: string;
  userId: number;
  username: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
}

interface Room {
  code: string;
  hostUserId: number;
  status: "waiting" | "playing" | "finished";
  players: RoomPlayer[];
}

interface ChatMessage {
  from: string;
  message: string;
  timestamp: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RoomPage() {
  const [, navigate] = useLocation();
  const { user, loading } = useCustomAuth();

  // If not logged in (and not loading), redirect to login
  useEffect(() => {
    if (!loading && user === null) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const [mode, setMode] = useState<"select" | "host" | "join" | "room">("select");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [hostCodeInput, setHostCodeInput] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Connect socket
  useEffect(() => {
    if (!user) return;
    const socket = io(window.location.origin, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("room:update", (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    socket.on("room:error", (data: { message: string }) => {
      setError(data.message);
    });

    socket.on("room:chat_message", (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on("room:game_start", () => {
      setGameStarted(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const joinRoom = useCallback((code: string, isHost: boolean) => {
    if (!socketRef.current || !user) return;
    setError(null);
    socketRef.current.emit("room:join", {
      roomCode: code,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      isHost,
    });
    setMode("room");
  }, [user]);

  const handleHostRoom = () => {
    const code = hostCodeInput.trim();
    if (!/^\d{3}$/.test(code)) {
      setError("房號必須是 3 位數字（例如：123）");
      return;
    }
    joinRoom(code, true);
  };

  const handleJoinRoom = () => {
    const code = roomCodeInput.trim();
    if (!/^\d{3}$/.test(code)) {
      setError("請輸入 3 位數字房號");
      return;
    }
    joinRoom(code, false);
  };

  const handleLeave = () => {
    socketRef.current?.emit("room:leave");
    setRoom(null);
    setMode("select");
    setGameStarted(false);
    setChatMessages([]);
  };

  const handleReady = () => {
    socketRef.current?.emit("room:ready");
  };

  const handleStart = () => {
    socketRef.current?.emit("room:start");
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit("room:chat", { message: chatInput.trim() });
    setChatInput("");
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-300 text-sm">驗證登入狀態...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const myPlayer = room?.players.find(p => p.userId === user.id);
  const isHost = myPlayer?.isHost ?? false;
  const allReady = room ? room.players.length >= 2 && room.players.every(p => p.isReady || p.isHost) : false;

  // ── Game Started Screen ────────────────────────────────────────────────────
  if (gameStarted && room) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-6xl mb-4">⚔️</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">遊戲開始！</h2>
            <p className="text-slate-500 mb-6">
              房間 <strong>{room.code}</strong> — {room.players.length} 位玩家
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {room.players.map(p => (
                <div key={p.userId} className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {p.displayName[0]}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-700">{p.displayName}</div>
                    {p.isHost && <div className="text-[10px] text-amber-500 font-semibold">房主</div>}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-sm mb-4">
              多設備對戰功能正在開發中，敬請期待完整版本！<br />
              目前可各自使用單人練習模式進行練習。
            </p>
            <Button onClick={handleLeave} variant="outline" className="gap-2">
              <ArrowLeft size={16} />
              返回大廳
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Select Mode ────────────────────────────────────────────────────────────
  if (mode === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            返回主頁
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg mx-auto mb-3">
              <Users size={32} className="text-slate-800" />
            </div>
            <h1 className="text-2xl font-black text-white">房間對戰</h1>
            <p className="text-slate-300 text-sm mt-1">最多 4 人即時對戰</p>
            <p className="text-slate-400 text-xs mt-1">
              已登入：<strong className="text-amber-300">{user.displayName}</strong>
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => { setMode("host"); setError(null); }}
              className="w-full bg-amber-400 hover:bg-amber-500 text-slate-800 font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-3 shadow-lg"
            >
              <Crown size={20} />
              開設房間（我是房主）
            </button>
            <button
              onClick={() => { setMode("join"); setError(null); }}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-3 shadow-lg"
            >
              <Sword size={20} />
              加入房間
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Host Mode ──────────────────────────────────────────────────────────────
  if (mode === "host") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <button
            onClick={() => { setMode("select"); setError(null); }}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            返回
          </button>

          <Card className="border-0 shadow-2xl bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Crown size={20} className="text-amber-500" />
                開設房間
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                  設定 3 位數字房號
                </label>
                <Input
                  type="text"
                  maxLength={3}
                  placeholder="例如：123"
                  value={hostCodeInput}
                  onChange={e => setHostCodeInput(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-2xl font-mono tracking-widest h-14"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
              )}
              <Button
                onClick={handleHostRoom}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-800 font-bold h-12"
                disabled={hostCodeInput.length !== 3}
              >
                <Crown size={16} className="mr-2" />
                建立房間
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Join Mode ──────────────────────────────────────────────────────────────
  if (mode === "join") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <button
            onClick={() => { setMode("select"); setError(null); }}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            返回
          </button>

          <Card className="border-0 shadow-2xl bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Sword size={20} className="text-indigo-500" />
                加入房間
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                  輸入房號（3 位數字）
                </label>
                <Input
                  type="text"
                  maxLength={3}
                  placeholder="例如：123"
                  value={roomCodeInput}
                  onChange={e => setRoomCodeInput(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-2xl font-mono tracking-widest h-14"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
              )}
              <Button
                onClick={handleJoinRoom}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-12"
                disabled={roomCodeInput.length !== 3}
              >
                <Sword size={16} className="mr-2" />
                加入房間
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Room Lobby ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center">
              <Users size={24} className="text-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">房間 {room?.code ?? "..."}</h2>
                <button
                  onClick={handleCopyCode}
                  className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="複製房號"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-slate-300 text-xs">
                {room?.players.length ?? 0}/4 人 · {isHost ? "你是房主" : "等待開始"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLeave}
            variant="outline"
            size="sm"
            className="gap-1 border-white/20 text-slate-300 hover:text-white bg-transparent"
          >
            <LogOut size={14} />
            離開
          </Button>
        </div>

        {/* Players */}
        <Card className="border-0 shadow-xl bg-white/95">
          <CardContent className="pt-4 pb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">玩家列表</h3>
            <div className="space-y-2">
              {room?.players.map(p => (
                <div key={p.userId} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {p.displayName[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                        {p.displayName}
                        {p.isHost && <Crown size={12} className="text-amber-500" />}
                        {p.userId === user.id && <span className="text-[10px] text-indigo-400 font-normal">（你）</span>}
                      </div>
                      <div className="text-[11px] text-slate-400">{p.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    {p.isHost ? (
                      <span className="text-amber-500 text-xs font-semibold">房主</span>
                    ) : p.isReady ? (
                      <span className="flex items-center gap-1 text-green-500 text-xs font-semibold">
                        <CheckCircle2 size={14} />
                        準備好了
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 text-xs">
                        <Circle size={14} />
                        等待中
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 4 - (room?.players.length ?? 0)) }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                    <Users size={16} />
                  </div>
                  <span className="text-slate-300 text-sm">等待玩家加入...</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              {!isHost && (
                <Button
                  onClick={handleReady}
                  className={`flex-1 font-bold ${myPlayer?.isReady
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                  }`}
                >
                  {myPlayer?.isReady ? (
                    <><CheckCircle2 size={16} className="mr-2" />已準備好</>
                  ) : (
                    <><Circle size={16} className="mr-2" />準備好了</>
                  )}
                </Button>
              )}
              {isHost && (
                <Button
                  onClick={handleStart}
                  disabled={!allReady && (room?.players.length ?? 0) < 2}
                  className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-800 font-bold disabled:opacity-50"
                >
                  <Play size={16} className="mr-2" />
                  開始遊戲
                  {!allReady && (room?.players.length ?? 0) < 2 && (
                    <span className="ml-2 text-xs opacity-70">（需要至少 2 人）</span>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="border-0 shadow-xl bg-white/95">
          <CardContent className="pt-4 pb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">聊天室</h3>
            <div className="h-32 overflow-y-auto space-y-1.5 mb-3 pr-1" style={{ scrollbarWidth: "thin" }}>
              {chatMessages.length === 0 && (
                <p className="text-slate-300 text-xs text-center py-4">還沒有訊息，打個招呼吧！</p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="font-semibold text-indigo-600">{msg.from}：</span>
                  <span className="text-slate-700">{msg.message}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendChat} className="flex gap-2">
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="輸入訊息..."
                className="flex-1 h-9 text-sm"
                maxLength={100}
              />
              <Button type="submit" size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white h-9">
                <Send size={14} />
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 text-red-200 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
