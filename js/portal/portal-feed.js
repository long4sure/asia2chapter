/**
 * portal-feed.js
 * Handles everything related to Tab 1: Home Feed and status comments.
 */

// Keep track of expanded comment sections so they stay expanded after refreshing the list
let expandedPostIds = new Set();

async function loadFeedTab() {
  // 1. Fetch aggregate statistics
  const kpis = await fetchPortalKPIs();
  
  const formatCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
  document.getElementById("kpiTotalFund").textContent = formatCurrency.format(kpis.totalFund);
  document.getElementById("kpiTotalMembers").textContent = kpis.totalMembers;

  // 2. Fetch Feed posts
  await refreshFeedList();
}

function handlePostFileSelect(input) {
  const file = input.files[0];
  const indicator = document.getElementById("postFileNameIndicator");
  if (file) {
    indicator.textContent = "✓ " + file.name.substring(0, 15) + (file.name.length > 15 ? "..." : "");
  } else {
    indicator.textContent = "";
  }
}

async function handleCreatePost(event) {
  event.preventDefault();
  
  const content = document.getElementById("postContent").value;
  const file = document.getElementById("postImageFile").files[0];
  const postBtn = document.getElementById("postBtn");

  if (!content.trim()) return;

  postBtn.disabled = true;
  postBtn.querySelector(".btn-text").innerHTML = `<span class="spinner"></span>Posting...`;

  try {
    await createStatusPost(content, file);
    
    // Reset form
    document.getElementById("postContent").value = "";
    document.getElementById("postImageFile").value = "";
    document.getElementById("postFileNameIndicator").textContent = "";

    // Reload feed
    await refreshFeedList();
  } catch (error) {
    console.error("Post creation failed:", error);
    alert("Failed to post status: " + error.message);
  } finally {
    postBtn.disabled = false;
    postBtn.querySelector(".btn-text").innerHTML = `Post Update <i class="fa-solid fa-paper-plane" style="margin-left: 6px;"></i>`;
  }
}

async function refreshFeedList() {
  const feedListContainer = document.getElementById("feedListContainer");
  
  try {
    const posts = await getStatusFeed();
    
    if (posts.length === 0) {
      feedListContainer.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text-muted); background:var(--glass-card); border-radius:8px;">
          <i class="fa-solid fa-feather-pointed" style="color:var(--gold); margin-right:8px;"></i> No status updates posted yet. Be the first to post!
        </div>
      `;
      return;
    }

    feedListContainer.innerHTML = posts.map(p => {
      const profile = p.profiles || {};
      const name = profile.name || "Unknown Brother";
      const alias = profile.alias ? `Bro. ${profile.alias}` : "Active Brother";
      const initial = name.charAt(0).toUpperCase();
      const avatar = profile.picture_url 
        ? `<img src="${profile.picture_url}" alt="${name}">`
        : initial;

      const date = new Date(p.created_at).toLocaleString();
      const imageTag = p.image_url 
        ? `<div style="position:relative; margin-top:12px; cursor:zoom-in;" onclick="openLightbox('${p.image_url}')" title="Click to view full size">
            <img src="${p.image_url}" class="status-attachment-img" alt="Post attachment" style="cursor:zoom-in; width:100%; display:block;">
            <div style="position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); border:1px solid rgba(201,168,76,0.3); color:var(--gold-light); font-size:9px; font-family:'Cinzel',serif; letter-spacing:1px; padding:4px 10px; border-radius:3px; pointer-events:none;">
              <i class="fa-solid fa-expand" style="margin-right:5px;"></i>View Full
            </div>
          </div>`
        : "";

      // Sort comments chronologically (oldest first)
      const sortedComments = (p.post_comments || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      // Comments List HTML
      const commentsListHtml = sortedComments.map(c => {
        const cProfile = c.profiles || {};
        const cName = cProfile.name || "Brother";
        const cAlias = cProfile.alias ? `Bro. ${cProfile.alias}` : "Active Brother";
        const cInitial = cName.charAt(0).toUpperCase();
        const cAvatar = cProfile.picture_url
          ? `<img src="${cProfile.picture_url}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" alt="${cName}">`
          : `<div style="width: 24px; height: 24px; border-radius: 50%; background: var(--gold-dark); color: var(--gold-light); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; border: 1px solid var(--gold-dark);">${cInitial}</div>`;
        const cDate = new Date(c.created_at).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
        
        // Delete button for comment owner or admin
        const isCommentOwner = c.user_id === currentUserProfile.id;
        const isAdmin = currentUserProfile.role === 'admin';
        const deleteBtn = (isCommentOwner || isAdmin)
          ? `<button type="button" onclick="handleDeleteComment('${c.id}', '${p.id}')" style="background:none; border:none; color:#e57373; font-size:10px; cursor:pointer; padding:2px 6px; border-radius:3px; transition:all 0.2s;" title="Delete Comment"><i class="fa-regular fa-trash-can"></i></button>`
          : "";

        return `
          <div class="comment-item" style="display: flex; gap: 10px; align-items: flex-start; padding: 8px 12px; background: rgba(255,255,255,0.015); border-radius: 6px; border: 1px solid rgba(255,255,255,0.02);">
            <div class="comment-avatar" style="flex-shrink:0;">${cAvatar}</div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; gap: 8px;">
                <span style="font-size: 11px; font-weight: bold; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${cName} <span style="font-size: 9px; color: var(--gold-light); font-weight: normal; margin-left: 2px;">(${cAlias})</span>
                </span>
                <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                  <span style="font-size: 9.5px; color: var(--text-muted);">${cDate}</span>
                  ${deleteBtn}
                </div>
              </div>
              <div style="font-size: 11.5px; color: rgba(255,255,255,0.85); line-height: 1.5; word-break: break-word;">
                ${c.content.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="status-card">
          <div class="status-card-top">
            <div class="status-user-info">
              <div class="status-user-avatar">${avatar}</div>
              <div>
                <div class="status-user-name">${name}</div>
                <div class="status-user-alias">${alias}</div>
              </div>
            </div>
            <div class="status-timestamp">${date}</div>
          </div>
          <div class="status-content">
            ${p.content.replace(/\n/g, '<br>')}
          </div>
          ${imageTag}
          
          <!-- Post Actions Footer -->
          <div class="status-card-actions" style="margin-top: 16px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.03); display: flex; justify-content: flex-start;">
            <button type="button" onclick="toggleComments('${p.id}')" style="background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.15); color: var(--gold-light); font-size: 10.5px; font-family: 'Cinzel', serif; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 4px; transition: all 0.3s; letter-spacing:1px; text-transform:uppercase;" onmouseover="this.style.background='rgba(201,168,76,0.15)'; this.style.borderColor='var(--gold)';" onmouseout="this.style.background='rgba(201,168,76,0.06)'; this.style.borderColor='rgba(201,168,76,0.15)';">
              <i class="fa-regular fa-comment"></i>
              <span>Comment</span> 
              <span style="background: var(--gold-dark); color: var(--white); font-size: 9px; padding: 1px 6px; border-radius: 10px; font-weight: bold;" id="comment-count-${p.id}">${(p.post_comments || []).length}</span>
            </button>
          </div>

          <!-- Collapsible Comments Section -->
          <div class="comments-section" id="comments-section-${p.id}" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px dashed rgba(201,168,76,0.15);">
            <div class="comments-list" id="comments-list-${p.id}" style="display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; margin-bottom: 14px; padding-right: 4px;">
              ${commentsListHtml || `<div style="font-size:10.5px; text-align:center; color:var(--text-muted); padding:16px 0;" id="no-comments-fallback-${p.id}"><i class="fa-regular fa-comments" style="margin-right:6px; color:var(--gold-light);"></i>No comments yet. Start the conversation!</div>`}
            </div>
            
            <!-- Comment Input Area -->
            <form onsubmit="submitComment(event, '${p.id}')" style="display: flex; gap: 10px; align-items: center; background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.03);">
              <input type="text" id="comment-input-${p.id}" placeholder="Write a status comment..." required style="flex: 1; padding: 6px 4px; background: transparent; border: none; color: var(--white); font-size: 11.5px; outline: none;" autocomplete="off">
              <button type="submit" class="btn-gold" style="padding: 6px 16px; border-radius: 20px; font-size: 9px; width: auto; font-family:'Cinzel', serif; letter-spacing:1px; cursor:pointer;">Send</button>
            </form>
          </div>
        </div>
      `;
    }).join('');

    // Restore expanded comments sections and scroll to bottom
    expandedPostIds.forEach(postId => {
      const section = document.getElementById(`comments-section-${postId}`);
      if (section) {
        section.style.display = "block";
        const list = document.getElementById(`comments-list-${postId}`);
        if (list) list.scrollTop = list.scrollHeight;
      }
    });

  } catch (error) {
    console.error("Error loading status updates:", error);
    feedListContainer.innerHTML = `
      <div style="text-align:center; padding:40px; color:#ff7e7e;">
        Failed to fetch status updates. Please check connection.
      </div>
    `;
  }
}

function toggleComments(postId) {
  const section = document.getElementById(`comments-section-${postId}`);
  if (section) {
    if (section.style.display === "none") {
      section.style.display = "block";
      expandedPostIds.add(postId);
      // Scroll comments list to bottom
      const list = document.getElementById(`comments-list-${postId}`);
      if (list) list.scrollTop = list.scrollHeight;
      // Auto focus the input field
      const input = document.getElementById(`comment-input-${postId}`);
      if (input) input.focus();
    } else {
      section.style.display = "none";
      expandedPostIds.delete(postId);
    }
  }
}

async function submitComment(event, postId) {
  event.preventDefault();
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) return;

  const submitBtn = event.target.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "...";

  try {
    await createPostComment(postId, content);
    input.value = "";
    
    // Mark as expanded so it stays open when feed reloads
    expandedPostIds.add(postId);
    
    // Refresh feed list to show the new comment
    await refreshFeedList();
  } catch (error) {
    console.error("Comment submit error:", error);
    alert("Failed to submit comment: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function handleDeleteComment(commentId, postId) {
  if (confirm("Are you sure you want to permanently delete this comment?")) {
    try {
      await deletePostComment(commentId);
      
      // Refresh feed list
      await refreshFeedList();
    } catch (error) {
      console.error("Delete comment error:", error);
      alert("Failed to delete comment: " + error.message);
    }
  }
}
