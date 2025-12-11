/**
 * Organization Facade
 *
 * 組織業務域門面（Shared 層）
 * Organization business domain facade (Shared layer)
 *
 * Provides unified interface for organization operations.
 *
 * @module shared/facades/account
 */

import { Injectable, inject } from '@angular/core';
import { OrganizationService, OrganizationBusinessModel, CreateOrganizationRequest, UpdateOrganizationRequest } from '../services';

import { BaseAccountCrudFacade } from './base-account-crud.facade';

@Injectable({
  providedIn: 'root'
})
export class OrganizationFacade extends BaseAccountCrudFacade<
  OrganizationBusinessModel,
  CreateOrganizationRequest,
  UpdateOrganizationRequest
> {
  private readonly organizationService = inject(OrganizationService);

  protected readonly entityTypeName = '組織';
  protected readonly facadeName = 'OrganizationFacade';

  // Proxy organization service signals
  readonly organizations = this.organizationService.organizations;
  readonly loading = this.organizationService.loading;
  readonly error = this.organizationService.error;

  /**
   * 執行創建操作
   */
  protected executeCreate(request: CreateOrganizationRequest): Promise<OrganizationBusinessModel> {
    return this.organizationService.createOrganization(request);
  }

  /**
   * 執行更新操作
   */
  protected executeUpdate(id: string, request: UpdateOrganizationRequest): Promise<OrganizationBusinessModel> {
    return this.organizationService.updateOrganization(id, request);
  }

  /**
   * 執行刪除操作
   */
  protected executeDelete(id: string): Promise<OrganizationBusinessModel> {
    return this.organizationService.softDeleteOrganization(id);
  }

  /**
   * 創建組織
   */
  async createOrganization(request: CreateOrganizationRequest): Promise<OrganizationBusinessModel> {
    return this.create(request);
  }

  /**
   * 更新組織
   */
  async updateOrganization(id: string, request: UpdateOrganizationRequest): Promise<OrganizationBusinessModel> {
    return this.update(id, request);
  }

  /**
   * 刪除組織（軟刪除）
   */
  async deleteOrganization(id: string): Promise<OrganizationBusinessModel> {
    return this.delete(id);
  }

  /**
   * 根據 ID 查詢組織
   */
  async findById(id: string): Promise<OrganizationBusinessModel | null> {
    return this.organizationService.findById(id);
  }

  /**
   * 查詢用戶創建的組織
   */
  async getUserCreatedOrganizations(authUserId: string): Promise<OrganizationBusinessModel[]> {
    return this.organizationService.getUserCreatedOrganizations(authUserId);
  }

  /**
   * 查詢用戶加入的組織
   */
  async getUserJoinedOrganizations(accountId: string): Promise<OrganizationBusinessModel[]> {
    return this.organizationService.getUserJoinedOrganizations(accountId);
  }
}
