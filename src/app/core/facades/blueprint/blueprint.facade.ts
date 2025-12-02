/**
 * Blueprint Facade
 *
 * 藍圖業務域門面（Core 層）
 * Blueprint business domain facade (Core layer)
 *
 * Provides unified interface for blueprint operations.
 *
 * @module core/facades/blueprint
 */

import { Injectable, inject } from '@angular/core';
import { BlueprintService, BlueprintBusinessModel, CreateBlueprintRequest, UpdateBlueprintRequest } from '@shared';

import { BlueprintRole } from '../../infra/types/blueprint';
import { BaseAccountCrudFacade } from '../account/base-account-crud.facade';

@Injectable({
  providedIn: 'root'
})
export class BlueprintFacade extends BaseAccountCrudFacade<BlueprintBusinessModel, CreateBlueprintRequest, UpdateBlueprintRequest> {
  private readonly blueprintService = inject(BlueprintService);

  protected readonly entityTypeName = '藍圖';
  protected readonly facadeName = 'BlueprintFacade';

  // Proxy blueprint service signals
  readonly blueprints = this.blueprintService.blueprints;
  readonly loading = this.blueprintService.loading;
  readonly error = this.blueprintService.error;

  /**
   * 執行創建操作
   */
  protected executeCreate(request: CreateBlueprintRequest): Promise<BlueprintBusinessModel> {
    return this.blueprintService.createBlueprint(request);
  }

  /**
   * 執行更新操作
   */
  protected executeUpdate(id: string, request: UpdateBlueprintRequest): Promise<BlueprintBusinessModel> {
    return this.blueprintService.updateBlueprint(id, request);
  }

  /**
   * 執行刪除操作
   */
  protected executeDelete(id: string): Promise<BlueprintBusinessModel> {
    return this.blueprintService.softDeleteBlueprint(id);
  }

  /**
   * 創建藍圖
   */
  async createBlueprint(request: CreateBlueprintRequest): Promise<BlueprintBusinessModel> {
    return this.create(request);
  }

  /**
   * 更新藍圖
   */
  async updateBlueprint(id: string, request: UpdateBlueprintRequest): Promise<BlueprintBusinessModel> {
    return this.update(id, request);
  }

  /**
   * 刪除藍圖（軟刪除）
   */
  async deleteBlueprint(id: string): Promise<BlueprintBusinessModel> {
    return this.delete(id);
  }

  /**
   * 根據 ID 查詢藍圖
   */
  async findById(id: string): Promise<BlueprintBusinessModel | null> {
    return this.blueprintService.findById(id);
  }

  /**
   * 根據擁有者查詢藍圖
   */
  async findByOwner(ownerId: string): Promise<BlueprintBusinessModel[]> {
    return this.blueprintService.findByOwner(ownerId);
  }

  /**
   * 查詢用戶可存取的藍圖
   */
  async getUserAccessibleBlueprints(accountId: string): Promise<BlueprintBusinessModel[]> {
    return this.blueprintService.getUserAccessibleBlueprints(accountId);
  }

  /**
   * 查詢公開藍圖
   */
  async findPublicBlueprints(): Promise<BlueprintBusinessModel[]> {
    return this.blueprintService.findPublicBlueprints();
  }

  /**
   * 查詢藍圖成員
   */
  async getBlueprintMembers(blueprintId: string): Promise<any[]> {
    return this.blueprintService.getBlueprintMembers(blueprintId);
  }

  /**
   * 添加藍圖成員
   */
  async addBlueprintMember(
    blueprintId: string,
    accountId: string,
    role: BlueprintRole = BlueprintRole.VIEWER,
    isExternal = false
  ): Promise<any> {
    return this.blueprintService.addBlueprintMember(blueprintId, accountId, role, isExternal);
  }

  /**
   * 更新藍圖成員角色
   */
  async updateBlueprintMemberRole(memberId: string, role: BlueprintRole): Promise<any> {
    return this.blueprintService.updateBlueprintMemberRole(memberId, role);
  }

  /**
   * 移除藍圖成員
   */
  async removeBlueprintMember(blueprintId: string, accountId: string): Promise<boolean> {
    return this.blueprintService.removeBlueprintMember(blueprintId, accountId);
  }
}
