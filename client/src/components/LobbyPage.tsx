/* ═══════════════════════════════════════════════════════════
 * LobbyPage - 游戏大厅
 * 显示所有可加入的房间列表，自动同步更新
 * 支持加入房间（需要密码则弹出密码输入）
 * ═══════════════════════════════════════════════════════════ */

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { onRoomListUpdate, removeAllListeners, joinRoom as joinRoomSocket } from '../network/socket';

export const LobbyPage: React.FC = () => {
  const { roomList, setRoomList, setScreen, openModal, playerName, setCurrentRoom, setJoinRoomCode } = useGameStore();
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
  const [passwordInputs, setPasswordInputs] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showPasswordInput, setShowPasswordInput] = useState<string | null>(null);

  /* ── 监听房间列表更新 ── */
  useEffect(() => {
    onRoomListUpdate((rooms) => {
      setRoomList(rooms);
    });

    return () => {
      removeAllListeners();
    };
  }, []);

  /* ── 直接加入房间（无密码） ── */
  const handleJoinRoom = async (room: typeof roomList[0]) => {
    // 如果房间有密码，显示密码输入框
    if (room.password) {
      setShowPasswordInput(room.roomCode);
      return;
    }

    setJoiningRoom(room.roomCode);
    try {
      const result = await joinRoomSocket(room.roomCode, playerName);
      if (result) {
        setCurrentRoom(result);
        setScreen('room');
      }
    } catch {
      // 失败重试
    }
    setJoiningRoom(null);
  };

  /* ── 带密码加入房间 ── */
  const handleJoinWithPassword = async (roomCode: string) => {
    const password = passwordInputs[roomCode] || '';
    setJoiningRoom(roomCode);
    setPasswordErrors((prev) => ({ ...prev, [roomCode]: '' }));

    try {
      const result = await joinRoomSocket(roomCode, playerName, password);
      if (result) {
        setCurrentRoom(result);
        setScreen('room');
        setShowPasswordInput(null);
      } else {
        setPasswordErrors((prev) => ({ ...prev, [roomCode]: '密码错误或房间已满' }));
      }
    } catch {
      setPasswordErrors((prev) => ({ ...prev, [roomCode]: '连接失败' }));
    }
    setJoiningRoom(null);
  };

  /* ── 返回主页 ── */
  const handleBack = () => {
    setScreen('home');
  };

  return (
    <div className="lobby-page">
      {/* 顶部导航 */}
      <div className="lobby-header">
        <button className="lobby-back" onClick={handleBack}>
          &lsaquo; 返回
        </button>
        <h2 className="lobby-title">游戏大厅</h2>
        <div className="lobby-count">{roomList.length} 个房间</div>
      </div>

      {/* 房间列表 */}
      <div className="lobby-list">
        {roomList.length === 0 ? (
          <div className="lobby-empty">
            <span className="lobby-empty-icon">&#x1F3E0;</span>
            <p>暂无可用房间</p>
            <button className="lobby-create-btn" onClick={() => openModal('create')}>
              创建房间
            </button>
          </div>
        ) : (
          roomList.map((room) => (
            <div key={room.roomId} className="lobby-room-card">
              <div className="lobby-room-left">
                <span className="lobby-room-code">#{room.roomCode}</span>
                <span className="lobby-room-host">{room.hostName}</span>
                {room.password && <span className="lobby-room-lock">🔒</span>}
              </div>
              <div className="lobby-room-right">
                <span className="lobby-room-players">
                  {room.players.length}/2
                </span>
                {/* 密码输入框 */}
                {showPasswordInput === room.roomCode ? (
                  <div className="lobby-room-password">
                    <input
                      className="lobby-password-input"
                      type="text"
                      placeholder="输入密码"
                      value={passwordInputs[room.roomCode] || ''}
                      onChange={(e) =>
                        setPasswordInputs((prev) => ({
                          ...prev,
                          [room.roomCode]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleJoinWithPassword(room.roomCode);
                      }}
                      autoFocus
                    />
                    <button
                      className="lobby-password-join"
                      onClick={() => handleJoinWithPassword(room.roomCode)}
                      disabled={joiningRoom === room.roomCode}
                    >
                      加入
                    </button>
                    <button
                      className="lobby-password-cancel"
                      onClick={() => {
                        setShowPasswordInput(null);
                        setPasswordErrors((prev) => ({ ...prev, [room.roomCode]: '' }));
                      }}
                    >
                      取消
                    </button>
                    {passwordErrors[room.roomCode] && (
                      <span className="lobby-password-error">{passwordErrors[room.roomCode]}</span>
                    )}
                  </div>
                ) : (
                  <button
                    className="lobby-room-join"
                    onClick={() => handleJoinRoom(room)}
                    disabled={joiningRoom === room.roomCode}
                  >
                    {joiningRoom === room.roomCode ? '加入中...' : '加入'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};