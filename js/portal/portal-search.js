/**
 * portal-search.js
 * Handles everything related to Tab 2: Search Profiles / Brothers Directory.
 */

async function loadSearchTab() {
  await refreshSearchGrid("");
}

async function handleSearchQuery(query) {
  await refreshSearchGrid(query.trim());
}

async function refreshSearchGrid(query) {
  const grid = document.getElementById("searchMembersGrid");
  grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px;"><span class="spinner"></span> Searching Brothers...</div>`;

  try {
    const members = await searchActiveProfiles(query);
    
    if (members.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted); background:var(--glass-card); border-radius:8px;">
          No matching brothers found in Asia 2 directory.
        </div>
      `;
      return;
    }

    grid.innerHTML = members.map(m => {
      const initials = m.name.charAt(0) + (m.name.split(' ').length > 1 ? m.name.split(' ').pop().charAt(0) : "");
      const avatar = m.picture_url
        ? `<img src="${m.picture_url}" alt="${m.name}">`
        : initials.toUpperCase();
      
      const tbirthStr = new Date(m.tbirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const roleText = m.role === 'admin' ? 'Officer' : (m.role === 'developer' ? 'Developer' : 'Brother');

      return `
        <div class="member-card">
          <div class="member-avatar">${avatar}</div>
          <div class="member-name">${m.name}</div>
          <div class="member-role" style="font-size:9.5px; margin-bottom:8px;">Bro. ${m.alias || "Active"}</div>
          <div class="sidebar-role-badge ${m.role === 'admin' ? 'admin' : (m.role === 'developer' ? 'developer' : 'user')}" style="font-size:8px; margin-bottom:12px;">${roleText}</div>
          <div style="font-size:10px; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.03); padding-top:10px; display:flex; flex-direction:column; gap:4px; text-align:left;">
            <div><span style="color:var(--gold);">Batch:</span> ${m.batchname}</div>
            <div><span style="color:var(--gold);">Tbirth:</span> ${tbirthStr}</div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error("Search error:", error);
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#ff7e7e;">Error searching active members.</div>`;
  }
}
