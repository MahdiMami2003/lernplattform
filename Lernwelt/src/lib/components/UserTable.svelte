<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from '$lib/i18n/config';
  import { get } from 'svelte/store';

  function t(key: string, params?: any) {
    const fn = get(_ as any);
    if (typeof fn === 'function') return fn(key, params);
    return '';
  }

  type Profile = {
    id: string;
    full_name: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
    editing_right: boolean;
  };

  // runes mode props
  let { groupUsers = [], emptyText = '', session = null } = $props();

  const dispatch = createEventDispatcher();

  function handleToggle(user: Profile) {
    dispatch('onToggleRights', user);
  }
  function handleOpenRole(user: Profile) {
    dispatch('onOpenRoleModal', user);
  }
</script>

{#if groupUsers.length === 0}
  <div class="empty">{emptyText}</div>
{:else}
  <div class="table-responsive">
    <table>
      <thead>
        <tr>
          <th>{$_('admin.user_table.headers.name')}</th>
          <th>{$_('admin.user_table.headers.rights')}</th>
          <th style="text-align: right;">{$_('admin.user_table.headers.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {#each groupUsers as user (user.id)}
          {@const isMe = session?.user?.id === user.id}
          <tr class:pending={user.role !== 'admin' && !user.editing_right}>
            <td>
              <div class="user-info">
                <strong>{user.full_name || $_('admin.user_table.unknown')}</strong>
                <small class="uuid">{user.id.slice(0,8)}...</small>
              </div>
            </td>
            <td>
              {#if user.editing_right}
                <span class="status-ok">✅ {$_('admin.user_table.status.edit_rights')}</span>
              {:else}
                <span class="status-no">⛔ {$_('admin.user_table.status.read_only')}</span>
              {/if}
            </td>
            <td style="overflow: visible;">
              <div class="actions">
                {#if !isMe}
                  <button class="btn-small" class:revoke={user.editing_right} class:grant={!user.editing_right} onclick={() => handleToggle(user)}>
                    {user.editing_right ? $_('admin.revoke_rights') : $_('admin.grant_rights')}
                  </button>

                  <button class="btn-small secondary" onclick={() => handleOpenRole(user)}>
                    {$_('admin.change_role_button')}
                  </button>
                {:else}
                  <span class="me-badge">{$_('admin.user_table.me')}</span>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .table-responsive { width: 100%; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 1rem; background: #f8fafc; color: #64748b; font-size: 0.85rem; text-transform: uppercase; }
  td { padding: 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .pending { background-color: #fff7ed; }
  .user-info { display: flex; flex-direction: column; }
  .uuid { color: #94a3b8; font-family: monospace; font-size: 0.8rem; }
  .status-ok { color: #16a34a; background: #dcfce7; padding: 0.2rem 0.6rem; border-radius: 99px; }
  .status-no { color: #dc2626; background: #fee2e2; padding: 0.2rem 0.6rem; border-radius: 99px; }
  .actions { display:flex; gap:0.5rem; justify-content:flex-end; align-items:center; }
  .btn-small { border: none; padding: 0.4rem 0.8rem; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.8rem; }
  .btn-small.grant { background:#22c55e; color:white; }

  .btn-small.revoke { background:#f59e0b; color:white; }
  .btn-small.secondary { background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; }
  .me-badge { color: #94a3b8; font-style: italic; font-size: 0.85rem; }
</style>
