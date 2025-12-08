/**
 * Blueprint Service
 *
 * 藍圖管理服務（Shared 層）
 * Blueprint management service (Shared layer)
 *
 * Provides business logic for blueprint operations.
 *
 * @module shared/services/blueprint
 */

import { Injectable, inject, signal } from '@angular/core';
import { BlueprintRepository, BlueprintMemberRepository, Blueprint, BlueprintRole, ModuleType, SupabaseService, LoggerService } from '@core';
import { firstValueFrom } from 'rxjs';

import { BlueprintBusinessModel, CreateBlueprintRequest, UpdateBlueprintRequest } from '../../models/blueprint';

@Injectable({
  providedIn: 'root'
})
export class BlueprintService {
  private readonly blueprintRepo = inject(BlueprintRepository);
  private readonly blueprintMemberRepo = inject(BlueprintMemberRepository);
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  // State
  private blueprintsState = signal<BlueprintBusinessModel[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Readonly signals
  readonly blueprints = this.blueprintsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  /**
   * 根據 ID 查詢藍圖
   * Find blueprint by ID
   */
  async findById(id: string): Promise<BlueprintBusinessModel | null> {
    const blueprint = await firstValueFrom(this.blueprintRepo.findById(id));
    return blueprint as BlueprintBusinessModel | null;
  }

  /**
   * 根據 owner_id 查詢藍圖列表
   * Find blueprints by owner
   */
  async findByOwner(ownerId: string): Promise<BlueprintBusinessModel[]> {
    const blueprints = await firstValueFrom(this.blueprintRepo.findByOwner(ownerId));
    return blueprints as BlueprintBusinessModel[];
  }

  /**
   * 查詢用戶可存取的藍圖
   * Find blueprints accessible by user (as owner or member)
   */
  async getUserAccessibleBlueprints(accountId: string): Promise<BlueprintBusinessModel[]> {
    // Get blueprints where user is owner
    const ownedBlueprints = await firstValueFrom(this.blueprintRepo.findByOwner(accountId));

    // Get blueprints where user is a member
    const memberships = await firstValueFrom(this.blueprintMemberRepo.findByAccount(accountId));
    const memberBlueprintIds = memberships.map(m => m.blueprint_id).filter(id => id && !ownedBlueprints.some(b => b.id === id));

    let memberBlueprints: Blueprint[] = [];
    if (memberBlueprintIds.length > 0) {
      memberBlueprints = await firstValueFrom(this.blueprintRepo.findByIds(memberBlueprintIds));
    }

    return [...ownedBlueprints, ...memberBlueprints] as BlueprintBusinessModel[];
  }

  /**
   * 查詢公開藍圖
   * Find public blueprints
   */
  async findPublicBlueprints(): Promise<BlueprintBusinessModel[]> {
    const blueprints = await firstValueFrom(this.blueprintRepo.findPublic());
    return blueprints as BlueprintBusinessModel[];
  }

  /**
   * 創建藍圖
   * Create blueprint
   *
   * Uses RPC function create_blueprint for proper handling
   */
  async createBlueprint(request: CreateBlueprintRequest): Promise<BlueprintBusinessModel> {
    const client = this.supabaseService.client;

    // Use SECURITY DEFINER function to create blueprint atomically
    const { data, error } = await (client as any).rpc('create_blueprint', {
      p_owner_id: request.ownerId,
      p_name: request.name,
      p_slug: request.slug || null,
      p_description: request.description || null,
      p_cover_url: request.coverUrl || null,
      p_is_public: request.isPublic ?? false,
      p_enabled_modules: request.enabledModules || [ModuleType.TASKS]
    });

    if (error) {
      this.logger.error('[BlueprintService] Failed to create blueprint:', error);
      throw error;
    }

    if (!data || !data[0]) {
      throw new Error('Failed to create blueprint');
    }

    const { out_blueprint_id } = data[0];

    // Fetch the created blueprint
    const blueprint = await firstValueFrom(this.blueprintRepo.findById(out_blueprint_id));
    if (!blueprint) {
      throw new Error('Blueprint record not found after creation');
    }

    return blueprint as BlueprintBusinessModel;
  }

  /**
   * 更新藍圖
   * Update blueprint
   */
  async updateBlueprint(id: string, request: UpdateBlueprintRequest): Promise<BlueprintBusinessModel> {
    const updates: Partial<Blueprint> = {};

    if (request.name !== undefined) updates.name = request.name;
    if (request.slug !== undefined) updates.slug = request.slug;
    if (request.description !== undefined) updates.description = request.description;
    if (request.coverUrl !== undefined) updates.cover_url = request.coverUrl;
    if (request.isPublic !== undefined) updates.is_public = request.isPublic;
    if (request.status !== undefined) updates.status = request.status;
    if (request.enabledModules !== undefined) updates.enabled_modules = request.enabledModules;

    const blueprint = await firstValueFrom(this.blueprintRepo.update(id, updates));
    if (!blueprint) {
      throw new Error('Failed to update blueprint');
    }
    return blueprint as BlueprintBusinessModel;
  }

  /**
   * 軟刪除藍圖
   * Soft delete blueprint
   */
  async softDeleteBlueprint(id: string): Promise<BlueprintBusinessModel> {
    const blueprint = await firstValueFrom(this.blueprintRepo.softDelete(id));
    if (!blueprint) {
      throw new Error('Failed to delete blueprint');
    }
    return blueprint as BlueprintBusinessModel;
  }

  /**
   * 恢復已刪除的藍圖
   * Restore deleted blueprint
   */
  async restoreBlueprint(id: string): Promise<BlueprintBusinessModel> {
    const blueprint = await firstValueFrom(this.blueprintRepo.restore(id));
    if (!blueprint) {
      throw new Error('Failed to restore blueprint');
    }
    return blueprint as BlueprintBusinessModel;
  }

  /**
   * 查詢藍圖成員
   * Get blueprint members
   */
  async getBlueprintMembers(blueprintId: string): Promise<any[]> {
    const members = await firstValueFrom(this.blueprintMemberRepo.findByBlueprint(blueprintId));
    return members;
  }

  /**
   * 添加藍圖成員
   * Add blueprint member
   */
  async addBlueprintMember(
    blueprintId: string,
    accountId: string,
    role: BlueprintRole = BlueprintRole.VIEWER,
    isExternal = false
  ): Promise<any> {
    const member = await firstValueFrom(
      this.blueprintMemberRepo.create({
        blueprint_id: blueprintId,
        account_id: accountId,
        role,
        is_external: isExternal
      })
    );
    if (!member) {
      throw new Error('Failed to add blueprint member');
    }
    return member;
  }

  /**
   * 更新藍圖成員角色
   * Update blueprint member role
   */
  async updateBlueprintMemberRole(memberId: string, role: BlueprintRole): Promise<any> {
    const member = await firstValueFrom(this.blueprintMemberRepo.update(memberId, { role }));
    if (!member) {
      throw new Error('Failed to update blueprint member role');
    }
    return member;
  }

  /**
   * 移除藍圖成員
   * Remove blueprint member
   */
  async removeBlueprintMember(blueprintId: string, accountId: string): Promise<boolean> {
    return await firstValueFrom(this.blueprintMemberRepo.deleteByBlueprintAndAccount(blueprintId, accountId));
  }
}
