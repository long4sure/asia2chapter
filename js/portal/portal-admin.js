/**
 * portal-admin.js
 * Handles everything related to Tab 4: Admin Panel, including subtabs, user management, messages, and report issue.
 */

let adminActiveSubtab = 'approvals';
let hasSeenApprovals = false;
let hasSeenMessages = false;

function switchAdminSubtab(subtabId) {
  adminActiveSubtab = subtabId;
  
  const btns = document.querySelectorAll(".admin-tab-btn");
  btns.forEach(b => b.classList.remove("active"));
  document.getElementById("adminSubtabBtn_" + subtabId).classList.add("active");

  const panels = document.querySelectorAll(".admin-subpanel");
  panels.forEach(p => p.classList.remove("active"));
  document.getElementById("adminSub_" + subtabId).classList.add("active");

  // Mark notifications as seen
  if (subtabId === 'messages') {
    hasSeenMessages = true;
  } else if (subtabId === 'approvals') {
    hasSeenApprovals = true;
  }

  refreshAdminSubtabData();
  updateAdminBadges();
}

async function loadAdminTab() {
  const isDev = currentUserProfile.role === 'developer';

  // Developer-only tabs: Manage Users, Manage Posts, System Logs
  ['users', 'posts', 'logs'].forEach(tabId => {
    const btn = document.getElementById(`adminSubtabBtn_${tabId}`);
    if (btn) btn.style.display = isDev ? 'inline-flex' : 'none';
  });

  switchAdminSubtab('approvals');
}

async function refreshAdminSubtabData() {
  if (adminActiveSubtab === 'approvals') {
    await loadAdminApprovals();
  } else if (adminActiveSubtab === 'users') {
    await loadAdminUsersList();
  } else if (adminActiveSubtab === 'contributions') {
    await loadAdminContributionsList();
  } else if (adminActiveSubtab === 'posts') {
    await loadAdminPostsList();
  } else if (adminActiveSubtab === 'logs') {
    await loadAdminLogsList();
  } else if (adminActiveSubtab === 'messages') {
    await loadAdminMessagesList();
  }
}

/* 4A. SUBTAB: PENDING APPROVALS QUEUE */
async function loadAdminApprovals() {
  const container = document.getElementById("adminApprovalsContainer");
  container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px;"><span class="spinner"></span> Loading pending registrations...</div>`;

  try {
    const pending = await adminGetPendingRegistrations();
    
    if (pending.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted); background:rgba(255,255,255,0.01); border-radius:8px; border:1px dashed rgba(201,168,76,0.1);">
          <i class="fa-solid fa-user-clock" style="color:var(--gold); margin-right:8px;"></i> No pending registration requests at this time.
        </div>
      `;
      return;
    }

    container.innerHTML = pending.map(u => {
      const initials = u.name.charAt(0) + (u.name.split(' ').length > 1 ? u.name.split(' ').pop().charAt(0) : "");
      const avatar = u.picture_url
        ? `<img src="${u.picture_url}" alt="${u.name}">`
        : initials.toUpperCase();
      const tbirthStr = new Date(u.tbirth).toLocaleDateString();

      return `
        <div class="pending-card">
          <div class="pending-card-top">
            <div class="pending-avatar">${avatar}</div>
            <div class="pending-meta">
              <h4>${u.name}</h4>
              <p>Request: ${u.role}</p>
            </div>
          </div>
          <div class="pending-details">
            <div class="pending-detail-row">
              <span class="pending-detail-label">Username:</span>
              <span class="pending-detail-value">${u.username}</span>
            </div>
            <div class="pending-detail-row">
              <span class="pending-detail-label">Email:</span>
              <span class="pending-detail-value">${u.email}</span>
            </div>
            <div class="pending-detail-row">
              <span class="pending-detail-label">Alias:</span>
              <span class="pending-detail-value">Bro. ${u.alias || "Active"}</span>
            </div>
            <div class="pending-detail-row">
              <span class="pending-detail-label">Batch:</span>
              <span class="pending-detail-value">${u.batchname}</span>
            </div>
            <div class="pending-detail-row">
              <span class="pending-detail-label">Tbirth:</span>
              <span class="pending-detail-value">${tbirthStr}</span>
            </div>
          </div>
          <div class="pending-actions">
            <button class="pending-btn approve" onclick="handleAdminDecision('${u.id}', 'approve')">Approve ✓</button>
            <button class="pending-btn reject" onclick="handleAdminDecision('${u.id}', 'reject')">Reject ✕</button>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error("Error approvals:", error);
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#ff7e7e;">Failed to load approvals queue.</div>`;
  }
}

async function handleAdminDecision(userId, decision) {
  const isApprove = decision === 'approve';
  const title = isApprove ? "Approve Registration" : "Reject Registration";
  const confirmMsg = isApprove 
    ? "Approve this user for portal access?" 
    : "REJECT and deny access to this registration?";
  
  showCustomConfirm(title, confirmMsg, isApprove ? "Yes, Approve" : "Yes, Reject", !isApprove, async () => {
    try {
      if (isApprove) {
        await adminApproveUser(userId, currentUserProfile.id, currentUserProfile.email);
        showCustomAlert("Success", "Registration Approved Successfully!");
      } else {
        await adminRejectUser(userId, currentUserProfile.id, currentUserProfile.email);
        showCustomAlert("Rejected", "Registration Rejected & Denied Access.");
      }
      await refreshAdminSubtabData();
      await updateAdminBadges();
    } catch (error) {
      console.error("Decision fail:", error);
      showCustomAlert("Error", "Action failed: " + error.message);
    }
  });
}

/* 4B. SUBTAB: USERS CRUD */
async function loadAdminUsersList() {
  const tbody = document.getElementById("adminUsersTableBody");
  tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px;"><span class="spinner"></span> Loading users directory...</td></tr>`;

  try {
    const users = await adminGetAllProfiles();
    
    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">No members recorded in database.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => {
      const initials = u.name.charAt(0) + (u.name.split(' ').length > 1 ? u.name.split(' ').pop().charAt(0) : "");
      const avatar = u.picture_url
        ? `<img src="${u.picture_url}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid var(--gold-dark);" alt="${u.name}">`
        : `<div class="sidebar-avatar" style="width:32px; height:32px; font-size:13px; margin:0;">${initials.toUpperCase()}</div>`;
      const tbirthStr = new Date(u.tbirth).toLocaleDateString();

      return `
        <tr>
          <td>${avatar}</td>
          <td style="color:var(--white); font-weight:bold;">${u.name}</td>
          <td>Bro. ${u.alias || "Active"}</td>
          <td>${u.batchname}</td>
          <td>${tbirthStr}</td>
          <td>${u.email}</td>
          <td><span class="badge ${u.role === 'admin' ? 'action-danger' : (u.role === 'developer' ? 'developer' : 'action-login')}">${u.role}</span></td>
          <td><span class="badge ${u.status === 'approved' ? 'action-login' : u.status === 'pending_approval' ? 'action-logout' : 'badge-danger'}">${u.status}</span></td>
          <td>
            <div class="table-actions">
              <button class="table-btn" onclick="openAdminUserEditModal('${u.id}', '${u.role}', '${u.status}', '${u.name.replace(/'/g, "\\'")}', '${u.tbirth}', '${u.alias.replace(/'/g, "\\'")}', '${u.batchname.replace(/'/g, "\\'")}')">Edit</button>
              <button class="table-btn danger" onclick="handleAdminDeleteUser('${u.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error("Users list error:", error);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:#ff7e7e;">Failed to load users list.</td></tr>`;
  }
}

function openAdminUserEditModal(id, role, status, name, tbirth, alias, batch) {
  document.getElementById("adminUserEditId").value = id;
  document.getElementById("adminUserRole").value = role;
  document.getElementById("adminUserStatus").value = status;
  document.getElementById("adminUserName").value = name;
  document.getElementById("adminUserTbirth").value = tbirth;
  document.getElementById("adminUserAlias").value = alias;
  document.getElementById("adminUserBatch").value = batch;

  showOverlayScreen("adminUserModal");
}

async function handleAdminUserSubmit(event) {
  event.preventDefault();
  
  const id = document.getElementById("adminUserEditId").value;
  const role = document.getElementById("adminUserRole").value;
  const status = document.getElementById("adminUserStatus").value;
  const name = document.getElementById("adminUserName").value;
  const tbirth = document.getElementById("adminUserTbirth").value;
  const alias = document.getElementById("adminUserAlias").value;
  const batchname = document.getElementById("adminUserBatch").value;

  try {
    await adminUpsertProfile({
      id, role, status, name, tbirth, alias, batchname
    });
    
    closeOverlayScreen("adminUserModal");
    alert("Member details updated successfully.");
    await refreshAdminSubtabData();

  } catch (error) {
    console.error("Admin user update fail:", error);
    if (error.message && error.message.includes("row-level security policy")) {
      alert("You do not have permission for this.");
    } else {
      alert("Failed updating member: " + error.message);
    }
  }
}

async function handleAdminDeleteUser(userId) {
  showCustomConfirm(
    "Delete User Profile",
    "🚨 <strong>WARNING:</strong> Are you sure you want to delete this user profile? This will mark their profile status as 'deleted' and permanently remove their authentication records.",
    "Permanently Delete",
    true,
    async () => {
      try {
        await adminDeleteProfile(userId, currentUserProfile.id, currentUserProfile.email);
        showCustomAlert("Success", "Member profile successfully deleted.");
        await refreshAdminSubtabData();
      } catch (error) {
        console.error("Admin delete fail:", error);
        showCustomAlert("Deletion Failed", error.message);
      }
    }
  );
}

/* 4C. SUBTAB: CONTRIBUTIONS CRUD */
async function loadAdminContributionsList() {
  const tbody = document.getElementById("adminContributionsTableBody");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px;"><span class="spinner"></span> Loading contributions logs...</td></tr>`;

  try {
    const contributions = await adminGetAllContributions();
    
    if (contributions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">No financial contributions recorded.</td></tr>`;
      return;
    }

    const formatCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

    tbody.innerHTML = contributions.map(c => {
      const profile = c.profiles || {};
      const name = profile.name || "Deleted User";
      const alias = profile.alias ? `Bro. ${profile.alias}` : "Brother";
      const dateStr = new Date(c.date).toLocaleDateString();

      return `
        <tr>
          <td style="color:var(--white); font-weight:bold;">${name} <span style="font-size:10px; color:var(--gold); font-weight:normal; margin-left:6px;">(${alias})</span></td>
          <td style="color:var(--gold-light); font-weight:bold;">${formatCurrency.format(c.amount)}</td>
          <td>${c.description}</td>
          <td>${dateStr}</td>
          <td>
            <div class="table-actions">
              <button class="table-btn" onclick="openContributionModal('edit', '${c.id}', '${c.user_id}', '${c.amount}', '${c.description.replace(/'/g, "\\'")}', '${c.date}')">Edit</button>
              <button class="table-btn danger" onclick="handleAdminDeleteContribution('${c.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error("Admin contributions error:", error);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#ff7e7e;">Failed to load financial records.</td></tr>`;
  }
}

async function openContributionModal(mode, id="", userId="", amount="", desc="", date="") {
  const title = document.getElementById("contribModalTitle");
  const userSelect = document.getElementById("contribUserId");
  
  // Populate approved users list dropdown
  userSelect.innerHTML = `<option value="">Loading brothers list...</option>`;
  
  try {
    const users = await adminGetAllProfiles();
    const approvedOnly = users.filter(u => u.status === 'approved');
    
    userSelect.innerHTML = approvedOnly.map(u => `
      <option value="${u.id}">${u.name} (Bro. ${u.alias || "Active"})</option>
    `).join('');
  } catch (e) {
    console.error("Error population select:", e);
  }

  if (mode === 'create') {
    title.textContent = "ADD CONTRIBUTION";
    document.getElementById("contribEditId").value = "";
    document.getElementById("contribAmount").value = "";
    document.getElementById("contribDesc").value = "";
    document.getElementById("contribDate").value = new Date().toISOString().split('T')[0];
  } else {
    title.textContent = "EDIT CONTRIBUTION";
    document.getElementById("contribEditId").value = id;
    document.getElementById("contribUserId").value = userId;
    document.getElementById("contribAmount").value = amount;
    document.getElementById("contribDesc").value = desc;
    document.getElementById("contribDate").value = date;
  }

  showOverlayScreen("contributionModal");
}

async function handleContributionSubmit(event) {
  event.preventDefault();
  
  const id = document.getElementById("contribEditId").value;
  const user_id = document.getElementById("contribUserId").value;
  const amount = parseFloat(document.getElementById("contribAmount").value);
  const description = document.getElementById("contribDesc").value;
  const date = document.getElementById("contribDate").value;

  if (!user_id || !amount || !description || !date) {
    alert("Please fill in all contribution details.");
    return;
  }

  try {
    if (!id) {
      // Create
      await adminCreateContribution({ user_id, amount, description, date }, currentUserProfile.id, currentUserProfile.email);
      alert("Contribution logged successfully.");
    } else {
      // Update
      await adminUpdateContribution(id, { user_id, amount, description, date }, currentUserProfile.id, currentUserProfile.email);
      alert("Contribution record updated successfully.");
    }
    
    closeOverlayScreen("contributionModal");
    await refreshAdminSubtabData();

  } catch (error) {
    console.error("Contribution submit error:", error);
    alert("Failed logging contribution: " + error.message);
  }
}

async function handleAdminDeleteContribution(id) {
  if (confirm("Are you sure you want to permanently delete this contribution entry?")) {
    try {
      await adminDeleteContribution(id, currentUserProfile.id, currentUserProfile.email);
      alert("Contribution entry deleted.");
      await refreshAdminSubtabData();
    } catch (error) {
      console.error("Admin delete contribution fail:", error);
      alert("Delete failed: " + error.message);
    }
  }
}

/* 4D. SUBTAB: POSTS CRUD */
async function loadAdminPostsList() {
  const tbody = document.getElementById("adminPostsTableBody");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px;"><span class="spinner"></span> Moderating feed updates...</td></tr>`;

  try {
    const posts = await adminGetAllPosts();
    
    if (posts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">No posts listed on the portal.</td></tr>`;
      return;
    }

    tbody.innerHTML = posts.map(p => {
      const profile = p.profiles || {};
      const name = profile.name || "Unknown Author";
      const dateStr = new Date(p.created_at).toLocaleString();

      return `
        <tr>
          <td style="color:var(--white); font-weight:bold;">${name}</td>
          <td style="max-width:300px; word-break:break-all;">${p.content.substring(0, 100)}${p.content.length > 100 ? "..." : ""}</td>
          <td>${p.image_url ? '<span style="color:#81c784;">✓ Attached</span>' : '✕ None'}</td>
          <td>${dateStr}</td>
          <td>
            <button class="table-btn danger" onclick="handleAdminDeletePost('${p.id}')">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error("Admin posts error:", error);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#ff7e7e;">Failed to load posts feed list.</td></tr>`;
  }
}

async function handleAdminDeletePost(postId) {
  if (confirm("Are you sure you want to permanently delete this status update?")) {
    try {
      await adminDeletePost(postId, currentUserProfile.id, currentUserProfile.email);
      alert("Status update post deleted successfully.");
      await refreshAdminSubtabData();
    } catch (error) {
      console.error("Post delete fail:", error);
      alert("Delete failed: " + error.message);
    }
  }
}

/* 4E. SUBTAB: AUDIT LOGS TIMELINE */
async function loadAdminLogsList() {
  const tbody = document.getElementById("adminLogsTableBody");
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px;"><span class="spinner"></span> Retrieving audit timelines...</td></tr>`;

  try {
    const logs = await adminGetAllLogs();
    
    if (!logs || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-muted);">System logs are empty.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      const dateStr = new Date(l.created_at).toLocaleString();
      let badgeClass = "action-crud";
      
      const actionText = l.action || "";
      if (actionText.includes("LOGIN")) badgeClass = "action-login";
      if (actionText.includes("LOGOUT")) badgeClass = "action-logout";
      if (actionText.includes("POST")) badgeClass = "action-post";
      if (actionText.includes("DELETE") || actionText.includes("REJECT")) badgeClass = "action-danger";

      return `
        <tr>
          <td>${dateStr}</td>
          <td style="color:var(--white);">${l.user_email || "System / Guest"}</td>
          <td><span class="badge ${badgeClass}">${actionText || "SYSTEM"}</span></td>
          <td class="log-row-details">${l.details || ""}</td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error("Admin logs error:", error);
    const msg = error?.message || 'Permission denied or table not found. Check Supabase RLS policies on the logs table.';
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#ff7e7e;">Failed to load system audit logs: <em>${msg}</em></td></tr>`;
  }
}

/* 4F. SUBTAB: CONTACT MESSAGES LIST */
async function loadAdminMessagesList() {
  const tbody = document.getElementById("adminMessagesTableBody");
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;"><span class="spinner"></span> Loading contact form messages...</td></tr>`;

  try {
    const messages = await adminGetAllMessages();
    
    if (messages.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No messages logged in database.</td></tr>`;
      return;
    }

    tbody.innerHTML = messages.map(m => {
      const dateStr = new Date(m.created_at).toLocaleString();
      
      let displaySubject = m.subject || "";
      let issueBadge = "";
      
      if (displaySubject.startsWith("PORTAL_ISSUE: ")) {
        displaySubject = displaySubject.replace("PORTAL_ISSUE: ", "");
        issueBadge = `<span class="badge action-danger" style="margin-right:6px; background:rgba(255,152,0,0.15); color:#ffa726; border:1px solid rgba(255,167,38,0.25); font-size:8px; font-family:'Lato', sans-serif;">Issue Report</span>`;
      }
      
      return `
        <tr>
          <td style="color:var(--white); font-weight:bold;">${m.name}</td>
          <td><a href="mailto:${m.email}" style="color:var(--gold-light); text-decoration:underline;">${m.email}</a></td>
          <td style="color:var(--gold); font-weight:bold;">
            <div style="display:flex; align-items:center;">
              ${issueBadge}
              <span>${displaySubject}</span>
            </div>
          </td>
          <td style="white-space:pre-wrap; max-width: 350px;">${m.message}</td>
          <td>${dateStr}</td>
          <td>
            <div class="table-actions">
              <button class="table-btn danger" onclick="handleAdminDeleteMessage('${m.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error("Admin messages loading error:", error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#ff7e7e;">Failed to load messages: ${error.message}</td></tr>`;
  }
}

async function handleAdminDeleteMessage(messageId) {
  if (confirm("Are you sure you want to delete this contact message log? This action is permanent.")) {
    try {
      await adminDeleteMessage(messageId, currentUserProfile.id, currentUserProfile.email);
      alert("Contact message successfully deleted.");
      await refreshAdminSubtabData();
      await updateAdminBadges();
    } catch (error) {
      console.error("Message delete fail:", error);
      alert("Deletion failed: " + error.message);
    }
  }
}

/* ==========================================
   ADMIN BADGES & NOTIFICATIONS
   ========================================== */
async function updateAdminBadges() {
  if (currentUserProfile && (currentUserProfile.role === 'admin' || currentUserProfile.role === 'developer')) {
    try {
      const pending = await adminGetPendingRegistrations();
      const messages = await adminGetAllMessages();

      const pendingCount = (pending && !hasSeenApprovals) ? pending.length : 0;
      const messagesCount = (messages && !hasSeenMessages) ? messages.length : 0;
      const totalAlerts = pendingCount + messagesCount;

      // Sidebar badge
      const sidebarBadge = document.getElementById("adminSidebarBadge");
      if (sidebarBadge) {
        if (totalAlerts > 0) {
          sidebarBadge.textContent = totalAlerts;
          sidebarBadge.style.display = "inline-block";
        } else {
          sidebarBadge.style.display = "none";
        }
      }

      // Approvals subtab badge
      const approvalsBadge = document.getElementById("adminApprovalsBadge");
      if (approvalsBadge) {
        if (pendingCount > 0) {
          approvalsBadge.textContent = pendingCount;
          approvalsBadge.style.display = "inline-block";
        } else {
          approvalsBadge.style.display = "none";
        }
      }

      // Messages subtab badge
      const messagesBadge = document.getElementById("adminMessagesBadge");
      if (messagesBadge) {
        if (messagesCount > 0) {
          messagesBadge.textContent = messagesCount;
          messagesBadge.style.display = "inline-block";
        } else {
          messagesBadge.style.display = "none";
        }
      }
    } catch (e) {
      console.error("Failed to update admin badges:", e);
    }
  }
}

/* ==========================================
   REPORT PORTAL ISSUE SYSTEM
   ========================================== */
function openReportIssueModal() {
  document.getElementById("reportSubject").value = "";
  document.getElementById("reportMessage").value = "";
  showOverlayScreen("reportIssueModal");
}

async function handleReportIssueSubmit(event) {
  event.preventDefault();

  const submitBtn = document.getElementById("reportIssueBtn");
  const btnText = submitBtn.querySelector(".btn-text");

  submitBtn.disabled = true;
  btnText.innerHTML = `<span class="spinner"></span>Sending Report...`;

  const subject = document.getElementById("reportSubject").value.trim();
  const messageContent = document.getElementById("reportMessage").value.trim();

  const reportData = {
    name: currentUserProfile.name,
    email: currentUserProfile.email,
    subject: `PORTAL_ISSUE: ${subject}`,
    message: messageContent
  };

  try {
    await submitContactMessage(reportData);
    alert("Salute, Brother! Your issue report has been securely sent to the Chapter Officers.");
    closeOverlayScreen("reportIssueModal");
    hasSeenMessages = false; // reset so admin sees new badge
    await updateAdminBadges();
  } catch (error) {
    console.error("Report issue failed:", error);
    alert("Failed to submit issue report: " + error.message);
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = "Send Report to Officers →";
  }
}
