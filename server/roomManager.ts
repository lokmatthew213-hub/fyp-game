/**
 * Room manager for multi-device battles using Socket.io.
 * Rooms hold up to 4 players. Host sets a 3-digit room code.
 * Game state is managed server-side and broadcast to all players.
 */

import type { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { generateNDeck, generateWDeck } from "../client/src/data/decks";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomPlayer {
  socketId: string;
  userId: number;
  username: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  hand: unknown[];
}

export interface Room {
  code: string;
  hostUserId: number;
  status: "waiting" | "playing" | "finished";
  players: RoomPlayer[];
  createdAt: number;
}

// In-memory room store (resets on server restart)
const rooms = new Map<string, Room>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoom(code: string) {
  return rooms.get(code) ?? null;
}

function broadcastRoom(io: SocketServer, code: string) {
  const room = getRoom(code);
  if (room) {
    io.to(code).emit("room:update", room);
  }
}

// ─── Socket.io setup ──────────────────────────────────────────────────────────

export function setupSocketIO(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    let currentRoomCode: string | null = null;
    let currentUser: { userId: number; username: string; displayName: string } | null = null;

    // ── Join or Create Room ──────────────────────────────────────────────────
    socket.on(
      "room:join",
      (data: {
        roomCode: string;
        userId: number;
        username: string;
        displayName: string;
        isHost: boolean;
      }) => {
        const { roomCode, userId, username, displayName, isHost } = data;
        currentUser = { userId, username, displayName };
        currentRoomCode = roomCode;

        let room = getRoom(roomCode);

        if (!room) {
          if (!isHost) {
            socket.emit("room:error", { message: "房間不存在，請確認房號" });
            return;
          }
          // Create new room
          room = {
            code: roomCode,
            hostUserId: userId,
            status: "waiting",
            players: [],
            createdAt: Date.now(),
          };
          rooms.set(roomCode, room);
        }

        if (room.status !== "waiting") {
          socket.emit("room:error", { message: "遊戲已開始，無法加入" });
          return;
        }

        if (room.players.length >= 4) {
          socket.emit("room:error", { message: "房間已滿（最多 4 人）" });
          return;
        }

        // Remove any stale entry for same user
        room.players = room.players.filter((p) => p.userId !== userId);

        room.players.push({
          socketId: socket.id,
          userId,
          username,
          displayName,
          isHost: isHost || room.hostUserId === userId,
          isReady: false,
          score: 0,
          hand: [],
        });

        socket.join(roomCode);
        broadcastRoom(io, roomCode);
      }
    );

    // ── Player Ready ─────────────────────────────────────────────────────────
    socket.on("room:ready", () => {
      if (!currentRoomCode || !currentUser) return;
      const room = getRoom(currentRoomCode);
      if (!room) return;
      const player = room.players.find((p) => p.userId === currentUser!.userId);
      if (player) {
        player.isReady = !player.isReady;
        broadcastRoom(io, currentRoomCode);
      }
    });

    // ── Start Game (host only) ───────────────────────────────────────────────
    socket.on("room:start", () => {
      if (!currentRoomCode || !currentUser) return;
      const room = getRoom(currentRoomCode);
      if (!room) return;
      if (room.hostUserId !== currentUser.userId) return;
      if (room.players.length < 1) return;

      room.status = "playing";
      // Deal initial hands
      room.players.forEach((p) => {
        const nDeck = generateNDeck();
        const wDeck = generateWDeck();
        p.hand = [...nDeck.slice(0, 6), ...wDeck.slice(0, 6)];
      });

      broadcastRoom(io, currentRoomCode);
      io.to(currentRoomCode).emit("room:game_start", {
        message: "遊戲開始！",
      });
    });

    // ── Chat message ─────────────────────────────────────────────────────────
    socket.on("room:chat", (data: { message: string }) => {
      if (!currentRoomCode || !currentUser) return;
      io.to(currentRoomCode).emit("room:chat_message", {
        from: currentUser.displayName,
        message: data.message,
        timestamp: Date.now(),
      });
    });

    // ── Leave Room ───────────────────────────────────────────────────────────
    socket.on("room:leave", () => {
      if (!currentRoomCode || !currentUser) return;
      const room = getRoom(currentRoomCode);
      if (room) {
        room.players = room.players.filter((p) => p.userId !== currentUser!.userId);
        if (room.players.length === 0) {
          rooms.delete(currentRoomCode);
        } else {
          // Transfer host if needed
          if (room.hostUserId === currentUser.userId && room.players.length > 0) {
            room.hostUserId = room.players[0].userId;
            room.players[0].isHost = true;
          }
          broadcastRoom(io, currentRoomCode);
        }
      }
      socket.leave(currentRoomCode);
      currentRoomCode = null;
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      if (!currentRoomCode || !currentUser) return;
      const room = getRoom(currentRoomCode);
      if (room) {
        room.players = room.players.filter((p) => p.socketId !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(currentRoomCode);
        } else {
          if (room.hostUserId === currentUser!.userId && room.players.length > 0) {
            room.hostUserId = room.players[0].userId;
            room.players[0].isHost = true;
          }
          broadcastRoom(io, currentRoomCode);
        }
      }
    });
  });

  return io;
}
