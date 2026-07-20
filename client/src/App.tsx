/* ═══════════════════════════════════════════════════════════
 * App - 根组件 · 页面路由
 * home → 主页 | room → 房间 | draft → 轮选 | game → 对战
 * ═══════════════════════════════════════════════════════════ */

import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { HomePage } from './components/HomePage';
import { MultiplayerModal } from './components/MultiplayerModal';
import { JoinGameModal } from './components/JoinGameModal';
import { CreateGameModal } from './components/CreateGameModal';
import { GameRoom } from './components/GameRoom';
import { DraftPage } from './components/DraftPage';
import { GameBoard } from './components/GameBoard';
import { SinglePlayerModal } from './components/SinglePlayerModal';
import {
  connect, getSocket,
  onRoomListUpdate, onGameStarted, onDraftAction, onPlayerReady,
  onPlayerJoined, onPlayerLeft,
  removeAllListeners,
} from './network/socket';

const App: React.FC = () => {
  const {
    screen,
    activeModal,
    currentRoom,
    setRoomList,
    setScreen,
    setSocketId,
    setRoomId,
    initDraft,
    applyDraftAction,
    setCurrentRoom,
  } = useGameStore();

  /* ── 创建/加入房间后自动跳转到房间界面 ── */
  useEffect(() => {
    if (currentRoom && screen !== 'room' && screen !== 'draft' && screen !== 'game') {
      setScreen('room');
    }
  }, [currentRoom]);

  /* ── 连接服务器并设置通用监听 ── */
  useEffect(() => {
    connect();

    const s = getSocket();
    s.on('connect', () => {
      setSocketId(s.id || '');
    });
    // 如果已经连接，立即设置
    if (s.id) {
      setSocketId(s.id);
    }

    // 监听房间列表更新
    onRoomListUpdate((rooms) => {
      setRoomList(rooms);
    });

    // 监听游戏开始（含轮选数据）
    onGameStarted((data) => {
      setRoomId(data.roomId);
      initDraft(data.draft.pool, data.draft.firstPlayer);
      setScreen('draft');
    });

    // 监听对手轮选动作
    onDraftAction((data) => {
      applyDraftAction(data.artifactId, data.subStep, data.actionType);
    });

    // 监听玩家准备状态
    onPlayerReady((data) => {
      const room = useGameStore.getState().currentRoom;
      if (room) {
        const updatedRoom = {
          ...room,
          players: room.players.map((p) =>
            p.id === data.playerId ? { ...p, ready: data.ready } : p
          ),
        };
        setCurrentRoom(updatedRoom);
      }
    });

    // 监听对手加入
    onPlayerJoined((data) => {
      const room = useGameStore.getState().currentRoom;
      if (room) {
        if (room.players.some((p) => p.id === data.playerId)) return;
        setCurrentRoom({
          ...room,
          players: [...room.players, { id: data.playerId, name: data.playerName, ready: false }],
        });
      }
    });

    // 监听对手离开
    onPlayerLeft((data) => {
      const room = useGameStore.getState().currentRoom;
      if (room) {
        setCurrentRoom({
          ...room,
          players: room.players.filter((p) => p.id !== data.playerId),
        });
      }
    });

    return () => {
      removeAllListeners();
    };
  }, []);

  /* ── 渲染弹窗 ── */
  const renderModal = () => {
    switch (activeModal) {
      case 'multiplayer':
        return <MultiplayerModal />;
      case 'join':
        return <JoinGameModal />;
      case 'create':
        return <CreateGameModal />;
      case 'single':
        return <SinglePlayerModal />;
      default:
        return null;
    }
  };

  /* ── 渲染主页面 ── */
  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomePage />;
      case 'room':
        return <GameRoom />;
      case 'draft':
        return <DraftPage />;
      case 'game':
        return <GameBoard />;
      default:
        return <HomePage />;
    }
  };

  return (
    <>
      {renderScreen()}
      {renderModal()}
    </>
  );
};

export default App;