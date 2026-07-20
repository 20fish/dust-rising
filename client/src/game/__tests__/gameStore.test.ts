import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../store/gameStore';

/* ═══════════════════════════════════════════════════════════
 *  GameStore 测试 - initGame, selectDice
 * ═══════════════════════════════════════════════════════════ */

describe('GameStore — initGame', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useGameStore.setState(useGameStore.getInitialState());
  });

  it('BUG 1: initGame 后双方玩家骰子区域应有骰子', () => {
    const store = useGameStore.getState();
    store.initGame();

    const state = useGameStore.getState();
    const playerTotal =
      state.player.zone.defense.length +
      state.player.zone.attack.length +
      state.player.zone.meditation.length;
    const opponentTotal =
      state.opponent.zone.defense.length +
      state.opponent.zone.attack.length +
      state.opponent.zone.meditation.length;

    // 双方都应该有骰子（意志 > 0 -> 至少1个骰子）
    expect(playerTotal).toBeGreaterThan(0);
    expect(opponentTotal).toBeGreaterThan(0);
  });

  it('BUG 1: initGame 后双方骰子值应在 1-6 范围内', () => {
    const store = useGameStore.getState();
    store.initGame();

    const state = useGameStore.getState();
    const allPlayerDice = [
      ...state.player.zone.defense,
      ...state.player.zone.attack,
      ...state.player.zone.meditation,
    ];
    const allOpponentDice = [
      ...state.opponent.zone.defense,
      ...state.opponent.zone.attack,
      ...state.opponent.zone.meditation,
    ];

    for (const die of allPlayerDice) {
      expect(die.value).toBeGreaterThanOrEqual(1);
      expect(die.value).toBeLessThanOrEqual(6);
    }
    for (const die of allOpponentDice) {
      expect(die.value).toBeGreaterThanOrEqual(1);
      expect(die.value).toBeLessThanOrEqual(6);
    }
  });

  it('BUG 1: initGame 后双方骰子数量应等于各自意志值', () => {
    const store = useGameStore.getState();
    store.initGame();

    const state = useGameStore.getState();
    const playerTotal =
      state.player.zone.defense.length +
      state.player.zone.attack.length +
      state.player.zone.meditation.length;
    const opponentTotal =
      state.opponent.zone.defense.length +
      state.opponent.zone.attack.length +
      state.opponent.zone.meditation.length;

    // 骰子总数 = 意志值（由第一列神器决定）
    expect(playerTotal).toBe(state.player.will);
    expect(opponentTotal).toBe(state.opponent.will);
  });

  it('BUG 1: initGame 后双方生命值应大于0（第三列神器提供生命）', () => {
    const store = useGameStore.getState();
    store.initGame();

    const state = useGameStore.getState();
    // 第三列神器（mingjing/wansha）的 life 为 50
    expect(state.player.life).toBeGreaterThan(0);
    expect(state.opponent.life).toBeGreaterThan(0);
  });

  it('BUG 1: initGame 后双方充能需求应大于0（第三列神器提供充能）', () => {
    const store = useGameStore.getState();
    store.initGame();

    const state = useGameStore.getState();
    // 第三列神器（mingjing/wansha）的 chargeRequirement 为 4
    const playerChargeReq = state.player.artifacts[2]?.chargeRequirement ?? 0;
    const opponentChargeReq = state.opponent.artifacts[2]?.chargeRequirement ?? 0;
    expect(playerChargeReq).toBeGreaterThan(0);
    expect(opponentChargeReq).toBeGreaterThan(0);
  });
});

describe('GameStore — selectDice (BUG 2: 禁止选中对方骰子)', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
  });

  it('BUG 2: 非防御模式时，selectDice 不应选中对手的骰子', () => {
    const store = useGameStore.getState();
    store.initGame();

    const state = useGameStore.getState();
    // 当前玩家是 player
    expect(state.currentPlayerId).toBe('player');

    // 获取对手的一个骰子 ID
    const opponentDice = [
      ...state.opponent.zone.defense,
      ...state.opponent.zone.attack,
      ...state.opponent.zone.meditation,
    ];
    expect(opponentDice.length).toBeGreaterThan(0);

    const opponentDiceId = opponentDice[0].id;
    store.selectDice(opponentDiceId);

    // 对手的骰子不应该被选中
    const updatedState = useGameStore.getState();
    expect(updatedState.selectedDiceIds).not.toContain(opponentDiceId);
  });

  it('BUG 2: 非防御模式时，selectDice 应能选中自己的骰子', () => {
    const store = useGameStore.getState();
    store.initGame();

    const state = useGameStore.getState();
    const playerDice = [
      ...state.player.zone.defense,
      ...state.player.zone.attack,
      ...state.player.zone.meditation,
    ];
    expect(playerDice.length).toBeGreaterThan(0);

    const playerDiceId = playerDice[0].id;
    store.selectDice(playerDiceId);

    const updatedState = useGameStore.getState();
    expect(updatedState.selectedDiceIds).toContain(playerDiceId);
  });

  it('BUG 2: 防御待定模式时，selectDice 应能选中对手的骰子（防御方需要选防御骰）', () => {
    const store = useGameStore.getState();
    store.initGame();

    // 模拟防御待定：对手攻击，当前玩家是防御方
    // 先切换到对手回合
    const state = useGameStore.getState();
    const opponentAttackDice = state.opponent.zone.attack;
    if (opponentAttackDice.length === 0) {
      // 如果对手没有攻击骰，跳过此测试
      return;
    }

    // 设置防御待定状态
    useGameStore.setState({
      defensePending: true,
      pendingAttackDiceId: opponentAttackDice[0].id,
      currentPlayerId: state.opponent.playerId,
    });

    // 防御方是 player，需要选防御骰来抵挡
    const updatedState = useGameStore.getState();
    const playerDefenseDice = updatedState.player.zone.defense;
    if (playerDefenseDice.length > 0) {
      const defenseDiceId = playerDefenseDice[0].id;
      store.selectDice(defenseDiceId);
      expect(useGameStore.getState().selectedDiceIds).toContain(defenseDiceId);
    }
  });

  it('BUG 2: deselectDice 应能取消选中任何已选中的骰子', () => {
    const store = useGameStore.getState();
    store.initGame();

    const state = useGameStore.getState();
    const playerDice = [
      ...state.player.zone.defense,
      ...state.player.zone.attack,
      ...state.player.zone.meditation,
    ];
    const playerDiceId = playerDice[0].id;

    store.selectDice(playerDiceId);
    expect(useGameStore.getState().selectedDiceIds).toContain(playerDiceId);

    store.deselectDice(playerDiceId);
    expect(useGameStore.getState().selectedDiceIds).not.toContain(playerDiceId);
  });
});