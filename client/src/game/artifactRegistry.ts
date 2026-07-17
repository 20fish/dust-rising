/* ═══════════════════════════════════════════════════════════
 * 神器注册表 — 统一管理内置神器 + 自定义神器
 *
 * 创意工坊就绪的设计:
 *   - 内置神器注册为 'builtin' 来源
 *   - 玩家自定义神器注册为 'custom' 来源
 *   - 自定义神器持久化到 localStorage
 *   - 支持 JSON 导入/导出
 *   - 属性预算校验
 *   - 图片路径通过 imageKey 动态解析
 * ═══════════════════════════════════════════════════════════ */

import type { ArtifactDef, Artifact, ArtifactColumn, ArtifactSource } from '../types/game';
import { ARTIFACT_BUDGET, createArtifactInstance } from '../types/game';
import { SKILL_REGISTRY } from './skills';

/* ── localStorage 键 ── */
const STORAGE_KEY = 'dust_rising_custom_artifacts';

/* ── 校验结果 ── */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/* ═══════════════════════════════════════════════════════════
 *  ArtifactRegistry — 单例注册表
 * ═══════════════════════════════════════════════════════════ */

class ArtifactRegistry {
  /** 所有神器定义（内置 + 自定义） */
  private defs: Map<string, ArtifactDef> = new Map();

  /** 注册内置神器 */
  registerBuiltin(def: ArtifactDef): void {
    this.defs.set(def.id, { ...def, source: 'builtin' });
  }

  /** 批量注册内置神器 */
  registerBuiltins(defs: ArtifactDef[]): void {
    for (const def of defs) {
      this.registerBuiltin(def);
    }
  }

  /** 注册自定义神器（会持久化到 localStorage） */
  registerCustom(def: Omit<ArtifactDef, 'source' | 'version'>): ArtifactDef {
    const full: ArtifactDef = {
      ...def,
      source: 'custom',
      version: 1,
      createdAt: Date.now(),
    };
    this.defs.set(full.id, full);
    this.saveToStorage();
    return full;
  }

  /** 删除自定义神器 */
  removeCustom(id: string): boolean {
    const def = this.defs.get(id);
    if (!def || def.source !== 'builtin') {
      this.defs.delete(id);
      this.saveToStorage();
      return true;
    }
    return false; // 不允许删除内置神器
  }

  /** 更新自定义神器 */
  updateCustom(id: string, updates: Partial<ArtifactDef>): ArtifactDef | null {
    const def = this.defs.get(id);
    if (!def || def.source === 'builtin') return null;
    const updated: ArtifactDef = { ...def, ...updates, version: (def.version || 1) + 1 };
    this.defs.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  /** 获取神器定义 */
  get(id: string): ArtifactDef | undefined {
    return this.defs.get(id);
  }

  /** 获取所有神器定义 */
  getAll(): ArtifactDef[] {
    return Array.from(this.defs.values());
  }

  /** 按来源过滤 */
  getBySource(source: ArtifactSource): ArtifactDef[] {
    return Array.from(this.defs.values()).filter((d) => d.source === source);
  }

  /** 按列过滤 */
  getByColumn(column: ArtifactColumn): ArtifactDef[] {
    return Array.from(this.defs.values()).filter((d) => d.column === column);
  }

  /** 获取所有自定义神器 */
  getCustom(): ArtifactDef[] {
    return this.getBySource('custom');
  }

  /** 获取所有内置神器 */
  getBuiltin(): ArtifactDef[] {
    return this.getBySource('builtin');
  }

  /** 获取神器总数 */
  get count(): number {
    return this.defs.size;
  }

  /** 从定义创建运行时实例 */
  createInstance(id: string): Artifact | null {
    const def = this.defs.get(id);
    if (!def) return null;
    return createArtifactInstance(def);
  }

  /** 根据神器 ID 获取图片路径 */
  getImagePath(id: string, column: ArtifactColumn): string {
    const def = this.defs.get(id);
    if (!def) return `/artifacts/unknown.jpg`;
    const col = column + 1;
    return `/artifacts/${def.imageKey} (${col}).jpg`;
  }

  /* ═══════════════════════════════════════════════════════════
   *  校验
   * ═══════════════════════════════════════════════════════════ */

  /** 校验神器定义是否合法 */
  validate(def: Partial<ArtifactDef>): ValidationResult {
    const errors: string[] = [];

    // 必填字段
    if (!def.id || !def.id.trim()) errors.push('神器ID不能为空');
    if (!def.name || !def.name.trim()) errors.push('神器名称不能为空');
    if (def.column === undefined || def.column === null) errors.push('必须指定所属列');

    // 属性预算
    if (def.speed !== undefined && def.will !== undefined) {
      if (def.speed + def.will > ARTIFACT_BUDGET.SPEED_WILL_MAX) {
        errors.push(`速度+意志不能超过${ARTIFACT_BUDGET.SPEED_WILL_MAX}（当前${def.speed + def.will}）`);
      }
    }
    if (def.life !== undefined) {
      if (def.life < 0) errors.push('生命值不能为负');
      if (def.life > ARTIFACT_BUDGET.LIFE_MAX) {
        errors.push(`生命值不能超过${ARTIFACT_BUDGET.LIFE_MAX}`);
      }
    }
    if (def.chargeRequirement !== undefined) {
      if (def.chargeRequirement > 0 && def.chargeRequirement < ARTIFACT_BUDGET.CHARGE_MIN) {
        errors.push(`充能需求至少为${ARTIFACT_BUDGET.CHARGE_MIN}（或设为0表示不充能）`);
      }
      if (def.chargeRequirement > ARTIFACT_BUDGET.CHARGE_MAX) {
        errors.push(`充能需求不能超过${ARTIFACT_BUDGET.CHARGE_MAX}`);
      }
    }

    // 骰点分布
    if (def.diceDistribution) {
      const values = Object.values(def.diceDistribution);
      const validTypes = ['attack', 'defense', 'meditation'];
      for (const v of values) {
        if (!validTypes.includes(v)) {
          errors.push(`骰点分布包含无效类型: ${v}`);
          break;
        }
      }
    }

    // 技能
    if (def.skills) {
      if (def.skills.length > ARTIFACT_BUDGET.SKILL_MAX) {
        errors.push(`技能数量不能超过${ARTIFACT_BUDGET.SKILL_MAX}`);
      }
      for (const skill of def.skills) {
        if (!SKILL_REGISTRY[skill.skillId]) {
          errors.push(`未知技能ID: ${skill.skillId}（仅支持内置技能）`);
        }
      }
    }

    // ID 唯一性
    if (def.id && def.source === 'custom') {
      const existing = this.defs.get(def.id);
      // 检查是否与其他自定义神器 ID 冲突
      for (const [id, d] of this.defs) {
        if (d.source === 'custom' && id !== def.id && def.name && d.name === def.name) {
          errors.push(`神器名称 "${def.name}" 已被使用`);
          break;
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /* ═══════════════════════════════════════════════════════════
   *  持久化 — localStorage
   * ═══════════════════════════════════════════════════════════ */

  /** 从 localStorage 加载自定义神器 */
  loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const customs: ArtifactDef[] = JSON.parse(raw);
      for (const def of customs) {
        if (def.source === 'custom') {
          this.defs.set(def.id, { ...def, source: 'custom' });
        }
      }
    } catch (e) {
      console.warn('[ArtifactRegistry] 加载自定义神器失败:', e);
    }
  }

  /** 保存自定义神器到 localStorage */
  private saveToStorage(): void {
    try {
      const customs = this.getCustom();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
    } catch (e) {
      console.warn('[ArtifactRegistry] 保存自定义神器失败:', e);
    }
  }

  /* ═══════════════════════════════════════════════════════════
   *  导入/导出
   * ═══════════════════════════════════════════════════════════ */

  /** 导出所有自定义神器为 JSON 字符串 */
  exportCustom(): string {
    return JSON.stringify(this.getCustom(), null, 2);
  }

  /** 从 JSON 字符串导入自定义神器（返回成功/失败计数） */
  importCustom(json: string): { imported: number; skipped: number; errors: string[] } {
    const result = { imported: 0, skipped: 0, errors: [] as string[] };
    try {
      const data = JSON.parse(json);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const validation = this.validate(item);
        if (!validation.valid) {
          result.errors.push(`${item.name || item.id}: ${validation.errors.join('; ')}`);
          result.skipped++;
          continue;
        }
        // 生成新 ID 避免冲突
        const id = item.id || `custom_${crypto.randomUUID().slice(0, 8)}`;
        this.registerCustom({ ...item, id });
        result.imported++;
      }
    } catch (e) {
      result.errors.push(`JSON 解析失败: ${e}`);
    }
    return result;
  }

  /** 清空所有自定义神器 */
  clearCustom(): void {
    for (const [id, def] of this.defs) {
      if (def.source === 'custom') {
        this.defs.delete(id);
      }
    }
    this.saveToStorage();
  }
}

/** 全局单例 */
export const artifactRegistry = new ArtifactRegistry();

/* ═══════════════════════════════════════════════════════════
 *  便捷函数 — 替代原有的 ALL_ARTIFACTS 直接访问
 * ═══════════════════════════════════════════════════════════ */

/** 获取神器定义 */
export function getArtifactDef(id: string): ArtifactDef | undefined {
  return artifactRegistry.get(id);
}

/** 获取所有神器定义 */
export function getAllArtifactDefs(): ArtifactDef[] {
  return artifactRegistry.getAll();
}

/** 按列获取神器定义 */
export function getArtifactDefsByColumn(column: ArtifactColumn): ArtifactDef[] {
  return artifactRegistry.getByColumn(column);
}

/** 从定义创建运行时实例 */
export function createArtifact(id: string): Artifact | null {
  return artifactRegistry.createInstance(id);
}

/** 获取神器图片路径 */
export function getArtifactImagePath(id: string, column: ArtifactColumn): string {
  return artifactRegistry.getImagePath(id, column);
}