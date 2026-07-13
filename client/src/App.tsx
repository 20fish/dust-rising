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
// import { SinglePlayerModal } from './components/SinglePlayerModal';
import { GameRoom } from './components/GameRoom';
import { DraftPage } from './components/DraftPage';
// import { LobbyPage } from './components/LobbyPage';
import { GameBoard } from './components/GameBoard';
import { connect, onRoomListUpdate, removeAllListeners } from './network/socket';

const App: React.FC = () => {
  const {
    screen,
    activeModal,
    currentRoom,
    setRoomList,
    setScreen,
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

    // 监听房间列表更新（大厅使用）
    onRoomListUpdate((rooms) => {
      setRoomList(rooms);
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
      // case 'single':
      //   return <SinglePlayerModal />;
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