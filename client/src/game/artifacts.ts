/* ═══════════════════════════════════════════════════════════
 * 神器数据 — 12个内置神器定义
 * 注册到 ArtifactRegistry 统一管理
 * ═══════════════════════════════════════════════════════════ */

import type { ArtifactDef, ArtifactColumn } from '../types/game';
import { BUILTIN_ARTIFACTS } from '../../../shared/artifactData';
import { artifactRegistry } from './artifactRegistry';

/* ── 启动时注册内置神器 ── */
artifactRegistry.registerBuiltins(BUILTIN_ARTIFACTS);

/* ═══════════════════════════════════════════════════════════
 *  便捷函数 — 向后兼容
 * ═══════════════════════════════════════════════════════════ */

/** 所有神器定义（内置 + 自定义） */
export const ALL_ARTIFACTS: ArtifactDef[] = BUILTIN_ARTIFACTS;

/** 根据获取神器定义 */
export function getArtifactsByColumn(column: ArtifactColumn): ArtifactDef[] {
  return artifactRegistry.getByColumn(column);
}

/** 根据ID获取神器定义 */
export function getArtifactById(id: string): ArtifactDef | undefined {
  return artifactRegistry.get(id);
}

/** 获取神器对应的图片路径 */
export function getArtifactImage(artifact: ArtifactDef): string {
  return artifactRegistry.getImagePath(artifact.id, artifact.column);
}