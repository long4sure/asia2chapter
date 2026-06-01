/**
 * portal-profile.js
 * Handles everything related to Tab 3: My Profile.
 */

function triggerEditAvatarInput() {
  document.getElementById("editAvatarFile").click();
}

function handleEditAvatarSelect(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById("editAvatarPreview").src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

async function loadProfileTab() {
  // 1. Populate VIEW card
  populateProfileViewCard();

  // 2. Populate editable fields
  document.getElementById("editName").value = currentUserProfile.name;
  document.getElementById("editTbirth").value = currentUserProfile.tbirth || "";
  document.getElementById("editAlias").value = currentUserProfile.alias || "";
  document.getElementById("editBatch").value = currentUserProfile.batchname || "";
  document.getElementById("editUsername").value = currentUserProfile.username || "";
  document.getElementById("editEmail").value = currentUserProfile.email || "";
  document.getElementById("editPassword").value = "";

  const editPreview = document.getElementById("editAvatarPreview");
  if (currentUserProfile.picture_url) {
    editPreview.src = currentUserProfile.picture_url;
  } else {
    editPreview.src = "images/asia2logo.png";
  }

  // 3. Start in VIEW mode
  toggleProfileEdit(false);

  // 4. Load Contribution list
  await refreshProfileContributions();
}

async function refreshProfileContributions() {
  const listEl = document.getElementById("myContributionsList");
  listEl.innerHTML = `<span class="spinner"></span> Loading contributions...`;

  try {
    const { total, list } = await getUserContributionDetails(currentUserProfile.id);
    
    const formatCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
    document.getElementById("myTotalContributions").textContent = formatCurrency.format(total);

    if (list.length === 0) {
      listEl.innerHTML = `<div style="font-size:11px; text-align:center; color:var(--text-muted); padding:16px 0;">No contributions recorded yet.</div>`;
      return;
    }

    listEl.innerHTML = list.map(item => {
      const dateStr = new Date(item.date).toLocaleDateString();
      return `
        <div class="contrib-history-item">
          <div>
            <strong style="color:var(--white);">${item.description}</strong>
            <div style="font-size:8.5px; color:var(--text-muted); margin-top:2px;">${dateStr}</div>
          </div>
          <div class="contrib-hist-amount">${formatCurrency.format(item.amount)}</div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error("Contributions error:", error);
    listEl.innerHTML = `<div style="color:#ff7e7e; font-size:11px;">Failed to load contribution logs.</div>`;
  }
}

async function handleEditProfileSubmit(event) {
  event.preventDefault();
  
  const saveBtn = document.getElementById("saveProfileBtn");
  saveBtn.disabled = true;
  saveBtn.querySelector(".btn-text").innerHTML = `<span class="spinner"></span>Saving Updates...`;

  const name = document.getElementById("editName").value;
  const tbirth = document.getElementById("editTbirth").value;
  const alias = document.getElementById("editAlias").value;
  const batchname = document.getElementById("editBatch").value;
  const username = document.getElementById("editUsername").value;
  const email = document.getElementById("editEmail").value;
  const password = document.getElementById("editPassword").value;
  const pictureFile = document.getElementById("editAvatarFile").files[0];

  try {
    await updateUserProfile(currentUserProfile.id, {
      name, tbirth, alias, batchname, email, username, password, pictureFile
    });

    alert("Profile updated successfully!");

    // Re-load session
    const sessionData = await getCurrentUserSession();
    currentUserProfile = sessionData.profile;

    // Update Sidebar UI, repopulate fields, and switch back to view mode
    updateSidebarProfileUI();
    await loadProfileTab();
    toggleProfileEdit(false);

  } catch (error) {
    console.error("Update fail:", error);
    alert("Failed to update profile: " + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.querySelector(".btn-text").textContent = "Save Changes";
  }
}

async function triggerDeleteAccount() {
  const prompt1 = confirm("⚠ WARNING: Are you absolutely sure you want to delete your portal account? This will permanently remove your profile data.");
  if (prompt1) {
    const prompt2 = confirm("⚠ SECURE VERIFICATION: This action is irreversible. All your posts and profile data will be permanently wiped. Confirm deletion?");
    if (prompt2) {
      try {
        await deleteUserAccount(currentUserProfile.id, currentUserProfile.email);
        alert("Account permanently deleted. Salute, Brother.");
        window.location.href = "login.html";
      } catch (e) {
        console.error("Deletion error:", e);
        alert("Deletion Failed: " + e.message);
      }
    }
  }
}

function toggleProfileEdit(showEdit) {
  document.getElementById("profileViewCard").style.display = showEdit ? "none" : "block";
  document.getElementById("profileEditCard").style.display = showEdit ? "block" : "none";
  if (!showEdit) {
    // refresh view card when canceling
    populateProfileViewCard();
  }
}

function populateProfileViewCard() {
  const p = currentUserProfile;
  if (!p) return;

  // Avatar
  const viewAvatar = document.getElementById("viewProfileAvatar");
  if (p.picture_url) {
    viewAvatar.innerHTML = `<img src="${p.picture_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    viewAvatar.textContent = p.name ? p.name.charAt(0).toUpperCase() : "?";
  }

  document.getElementById("viewProfileName").textContent = p.name || "Brother";
  document.getElementById("viewProfileAlias").textContent = p.alias || "—";
  document.getElementById("viewProfileBatch").textContent = p.batchname || "—";
  document.getElementById("viewProfileUsername").textContent = p.username || "—";
  document.getElementById("viewProfileEmail").textContent = p.email || "—";

  // Triskelion birth - format nicely
  if (p.tbirth) {
    const d = new Date(p.tbirth + "T00:00:00");
    document.getElementById("viewProfileTbirth").textContent = d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  } else {
    document.getElementById("viewProfileTbirth").textContent = "—";
  }

  // Role badge
  const roleBadge = document.getElementById("viewProfileRoleBadge");
  if (p.role === 'developer') {
    roleBadge.textContent = "🛠 Developer";
    roleBadge.className = "sidebar-role-badge developer";
  } else if (p.role === 'admin') {
    roleBadge.textContent = "Officer / Admin";
    roleBadge.className = "sidebar-role-badge admin";
  } else {
    roleBadge.textContent = "Brother";
    roleBadge.className = "sidebar-role-badge user";
  }
}
