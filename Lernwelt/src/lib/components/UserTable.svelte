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
  th { text-align: left; padding: 1rem; background: var(--bg-hover); color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase; }
  td { padding: 1rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; color: var(--text-primary); }
  .pending { background-color: var(--bg-card-alt); }
  .user-info { display: flex; flex-direction: column; }
  .user-info strong { color: var(--text-primary); }
  .uuid { color: var(--text-muted); font-family: monospace; font-size: 0.8rem; }
  
  /* Status Badges - customized with variables but keeping colors distinct */
  .status-ok { color: var(--success-color); border: 1px solid var(--success-color); padding: 0.2rem 0.6rem; border-radius: 99px; background: transparent; }
  .status-no { color: var(--error-color); border: 1px solid var(--error-color); padding: 0.2rem 0.6rem; border-radius: 99px; background: transparent; }
  
  .actions { display:flex; gap:0.5rem; justify-content:flex-end; align-items:center; }
  
  .btn-small { border: 1px solid transparent; padding: 0.4rem 0.8rem; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.8rem; transition: all 0.2s ease; }
  .btn-small:hover { opacity: 0.9; transform: translateY(-1px); }
  
  .btn-small.grant { background: var(--success-color); color: white; }
  .btn-small.revoke { background: var(--warning-color); color: white; }
  
  .btn-small.secondary { background: var(--bg-hover); color: var(--text-secondary); border: 1px solid var(--border-color); }
  
  .me-badge { color: var(--text-muted); font-style: italic; font-size: 0.85rem; }
</style>
