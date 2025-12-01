/**
 * Organization Member Service
 *
 * 組織成員管理服務（Shared 層）
 * Organization member management service (Shared layer)
 *
 * Provides business logic for organization member operations.
 *
 * @module shared/services/account
 */

import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  OrganizationMemberRepository,
  AccountRepository,
  OrganizationMember,
  OrganizationRole,
  Account
} from '@core';

import { AddOrganizationMemberRequest } from '../../models/account';

/**
 * Organization member with account details
 */
export interface OrganizationMemberWithAccount extends OrganizationMember {
  account?: Account;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationMemberService {
  private readonly organizationMemberRepo = inject(OrganizationMemberRepository);
  private readonly accountRepo = inject(AccountRepository);

  // State
  private membersState = signal<OrganizationMemberWithAccount[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Readonly signals
  readonly members = this.membersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  /**
   * 查詢組織成員（含帳戶詳情）
   * Find organization members with account details
   */
  async findByOrganization(organizationId: string): Promise<OrganizationMemberWithAccount[]> {
    const members = await firstValueFrom(
      this.organizationMemberRepo.findByOrganization(organizationId)
    );

    // Fetch account details for each member
    const membersWithAccounts: OrganizationMemberWithAccount[] = [];
    for (const member of members) {
      const account = await firstValueFrom(this.accountRepo.findById(member.account_id));
      membersWithAccounts.push({
        ...member,
        account: account || undefined
      });
    }

    return membersWithAccounts;
  }

  /**
   * 查詢帳戶的組織成員關係
   * Find memberships by account
   */
  async findByAccount(accountId: string): Promise<OrganizationMember[]> {
    return firstValueFrom(this.organizationMemberRepo.findByAccount(accountId));
  }

  /**
   * 檢查是否為組織成員
   * Check if account is organization member
   */
  async isMember(organizationId: string, accountId: string): Promise<boolean> {
    return firstValueFrom(
      this.organizationMemberRepo.isMember(organizationId, accountId)
    );
  }

  /**
   * 獲取用戶在組織中的角色
   * Get user role in organization
   */
  async getRole(organizationId: string, accountId: string): Promise<OrganizationRole | null> {
    return firstValueFrom(
      this.organizationMemberRepo.getRole(organizationId, accountId)
    );
  }

  /**
   * 添加組織成員
   * Add organization member
   */
  async addMember(request: AddOrganizationMemberRequest): Promise<OrganizationMember | null> {
    if (!request.accountId && !request.email) {
      throw new Error('Either accountId or email must be provided');
    }

    let accountId = request.accountId;

    // If email is provided, look up the account
    if (!accountId && request.email) {
      const account = await firstValueFrom(this.accountRepo.findByEmail(request.email));
      if (!account) {
        throw new Error('找不到該 Email 對應的帳戶');
      }
      accountId = account.id;
    }

    if (!accountId) {
      throw new Error('無法確定帳戶 ID');
    }

    // Check if already a member
    const isMember = await this.isMember(request.organizationId, accountId);
    if (isMember) {
      throw new Error('該用戶已是組織成員');
    }

    return firstValueFrom(
      this.organizationMemberRepo.create({
        organization_id: request.organizationId,
        account_id: accountId,
        role: request.role
      })
    );
  }

  /**
   * 更新成員角色
   * Update member role
   */
  async updateRole(memberId: string, role: OrganizationRole): Promise<OrganizationMember | null> {
    return firstValueFrom(this.organizationMemberRepo.updateRole(memberId, role));
  }

  /**
   * 移除組織成員
   * Remove organization member
   */
  async removeMember(memberId: string): Promise<boolean> {
    return firstValueFrom(this.organizationMemberRepo.remove(memberId));
  }

  /**
   * 按組織和帳戶移除成員
   * Remove member by organization and account
   */
  async removeMemberByOrgAndAccount(organizationId: string, accountId: string): Promise<boolean> {
    return firstValueFrom(
      this.organizationMemberRepo.removeByOrgAndAccount(organizationId, accountId)
    );
  }
}
