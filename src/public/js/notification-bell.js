/**
 * NOTIFICATION BELL COMPONENT
 * 
 * A self-contained, injectable notification bell for any dashboard.
 * 
 * Usage:
 *   1. Include this script in your HTML
 *   2. Call: NotificationBell.init('#notification-bell-container', token)
 * 
 * The component will render the bell icon, badge, and dropdown panel.
 */

window.NotificationBell = (() => {
    let _token = null;
    let _container = null;
    let _pollInterval = null;
    let _notifications = [];
    let _unreadCount = 0;
    let _isOpen = false;

    // ─── Render ───────────────────────────────────────────────────────────
    const render = () => {
        if (!_container) return;
        _container.innerHTML = `
            <div class="notification-bell-wrapper" style="position:relative;">
                <button id="notif-bell-btn" onclick="NotificationBell.toggle()" 
                    style="position:relative; padding:8px; border-radius:8px; background:transparent; border:none; cursor:pointer; color: var(--notif-icon-color, #6b7280);"
                    title="Notifikasi">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
                    </svg>
                    ${_unreadCount > 0 ? `
                    <span id="notif-badge" style="
                        position:absolute; top:4px; right:4px;
                        background:#ef4444; color:white;
                        border-radius:50%; width:18px; height:18px;
                        font-size:10px; font-weight:700;
                        display:flex; align-items:center; justify-content:center;
                        border:2px solid white;
                        animation: notif-pulse 2s infinite;
                    ">${_unreadCount > 99 ? '99+' : _unreadCount}</span>` : ''}
                </button>

                <div id="notif-dropdown" style="
                    display: ${_isOpen ? 'flex' : 'none'};
                    flex-direction: column;
                    position:absolute; right:0; top:calc(100% + 8px);
                    width:360px; max-height:480px;
                    background: var(--notif-bg, white);
                    border: 1px solid var(--notif-border, #e5e7eb);
                    border-radius:16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                    z-index:9999;
                    overflow:hidden;
                ">
                    <div style="
                        padding:16px 20px;
                        border-bottom:1px solid var(--notif-border, #e5e7eb);
                        display:flex; justify-content:space-between; align-items:center;
                        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                        color:white;
                    ">
                        <span style="font-weight:700; font-size:15px;">🔔 Notifikasi</span>
                        <div style="display:flex; gap:8px; align-items:center;">
                            ${_unreadCount > 0 ? `<button onclick="NotificationBell.markAllRead()" style="font-size:11px; background:rgba(255,255,255,0.2); border:none; color:white; padding:4px 10px; border-radius:20px; cursor:pointer; font-weight:600;">Tandai semua dibaca</button>` : ''}
                            <button onclick="NotificationBell.toggle()" style="background:none; border:none; color:white; cursor:pointer; font-size:18px; line-height:1;">×</button>
                        </div>
                    </div>
                    <div id="notif-list" style="overflow-y:auto; flex:1; max-height:380px;">
                        ${renderNotificationList()}
                    </div>
                </div>
            </div>
            <style>
                @keyframes notif-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                .notif-item:hover { background: var(--notif-hover, #f9fafb) !important; }
            </style>
        `;
    };

    const renderNotificationList = () => {
        if (_notifications.length === 0) {
            return `<div style="padding:40px 20px; text-align:center; color:#9ca3af;">
                <div style="font-size:40px; margin-bottom:12px;">🔕</div>
                <p style="font-weight:600; margin:0 0 4px;">Tidak ada notifikasi</p>
                <p style="font-size:12px; margin:0;">Anda sudah up to date!</p>
            </div>`;
        }

        return _notifications.map(n => {
            const icons = {
                loan_approved: '✅', loan_rejected: '❌', loan_overdue: '⏰',
                penalty_issued: '💰', penalty_adjusted: '✏️', penalty_cancelled: '🚫',
                new_message: '💬', payment_completed: '💳', return_submitted: '📦',
                return_verified: '🔍', system: 'ℹ️'
            };
            const icon = icons[n.type] || '🔔';
            const timeAgo = formatTimeAgo(n.created_at);
            const isUnread = !n.is_read;

            return `<div class="notif-item" onclick="NotificationBell.handleClick(${n.id}, '${n.action_url || ''}')" style="
                padding:14px 20px;
                border-bottom:1px solid var(--notif-border, #f3f4f6);
                cursor:pointer;
                display:flex; gap:12px; align-items:flex-start;
                background: ${isUnread ? 'var(--notif-unread-bg, #eff6ff)' : 'transparent'};
                transition: background 0.15s;
            ">
                <div style="font-size:20px; flex-shrink:0; margin-top:2px;">${icon}</div>
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                        <p style="margin:0 0 3px; font-weight:${isUnread ? '700' : '600'}; font-size:13px; color:var(--notif-title, #111827); line-height:1.3;">${n.title}</p>
                        ${isUnread ? '<div style="width:8px; height:8px; border-radius:50%; background:#3b82f6; flex-shrink:0; margin-top:4px;"></div>' : ''}
                    </div>
                    <p style="margin:0 0 6px; font-size:12px; color:var(--notif-text, #6b7280); line-height:1.4;">${n.message}</p>
                    <span style="font-size:11px; color:#9ca3af;">${timeAgo}</span>
                </div>
            </div>`;
        }).join('');
    };

    const formatTimeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Baru saja';
        if (mins < 60) return `${mins} menit lalu`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} jam lalu`;
        const days = Math.floor(hours / 24);
        return `${days} hari lalu`;
    };

    // ─── API Calls ────────────────────────────────────────────────────────
    const fetchNotifications = async () => {
        if (!_token) return;
        try {
            const res = await fetch('/api/notifications?limit=15', {
                headers: { 'Authorization': `Bearer ${_token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.success) {
                _notifications = data.notifications;
                _unreadCount = data.unread_count;
                render();
            }
        } catch (e) { /* silent fail */ }
    };

    const fetchUnreadCount = async () => {
        if (!_token) return;
        try {
            const res = await fetch('/api/notifications/unread-count', {
                headers: { 'Authorization': `Bearer ${_token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.success && data.unread_count !== _unreadCount) {
                _unreadCount = data.unread_count;
                // Only re-render if count changed (avoid flicker)
                if (!_isOpen) render();
            }
        } catch (e) { /* silent fail */ }
    };

    // ─── Public API ───────────────────────────────────────────────────────
    return {
        init(containerSelector, token) {
            _token = token;
            _container = typeof containerSelector === 'string'
                ? document.querySelector(containerSelector)
                : containerSelector;
            if (!_container) { console.warn('NotificationBell: container not found'); return; }

            fetchNotifications();
            // Poll unread count every 30s, full fetch every 60s
            _pollInterval = setInterval(fetchUnreadCount, 30000);
            setInterval(fetchNotifications, 60000);

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (_isOpen && _container && !_container.contains(e.target)) {
                    _isOpen = false;
                    render();
                }
            });
        },

        toggle() {
            _isOpen = !_isOpen;
            if (_isOpen) fetchNotifications();
            render();
        },

        async handleClick(id, actionUrl) {
            // Mark as read
            try {
                await fetch(`/api/notifications/${id}/read`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${_token}` }
                });
            } catch (e) { }

            // Navigate if URL provided
            if (actionUrl && actionUrl !== 'undefined' && actionUrl !== '') {
                window.location.href = actionUrl;
            }
            await fetchNotifications();
        },

        async markAllRead() {
            try {
                await fetch('/api/notifications/read-all', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${_token}` }
                });
            } catch (e) { }
            await fetchNotifications();
        },

        destroy() {
            if (_pollInterval) clearInterval(_pollInterval);
        }
    };
})();
