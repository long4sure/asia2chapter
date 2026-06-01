/**
 * portal-ui.js
 * Handles global state, session init, sidebar, tab routing, overlay/modal helpers, disclaimer, and logout.
 */

let currentSession = null;
let currentUserProfile = null;

// Modal / Overlay Helpers
function showOverlayScreen(screenId) {
  document.getElementById(screenId).classList.add("active");
}

function closeOverlayScreen(screenId) {
  document.getElementById(screenId).classList.remove("active");
}

function showCustomAlert(title, message) {
  document.getElementById("customAlertTitle").textContent = title;
  document.getElementById("customAlertMessage").innerHTML = message;
  showOverlayScreen("customAlertModal");
}

function showCustomConfirm(title, message, confirmBtnText, isDanger, onConfirmCallback) {
  document.getElementById("customConfirmTitle").textContent = title;
  document.getElementById("customConfirmMessage").innerHTML = message;
  
  const btn = document.getElementById("customConfirmBtn");
  btn.textContent = confirmBtnText;
  
  if (isDanger) {
    btn.style.background = "#ff4b4b";
    btn.style.color = "white";
    document.getElementById("customConfirmTitle").style.color = "#ff7e7e";
  } else {
    btn.style.background = "var(--gold)";
    btn.style.color = "var(--bg-color)";
    document.getElementById("customConfirmTitle").style.color = "var(--gold)";
  }

  btn.onclick = () => {
    closeOverlayScreen("customConfirmModal");
    if (onConfirmCallback) onConfirmCallback();
  };
  
  showOverlayScreen("customConfirmModal");
}

// Load active session on init
document.addEventListener("DOMContentLoaded", async () => {
  if (!isConfigured()) {
    window.location.href = "login.html";
    return;
  }
  
  // Get DB Client
  getDbClient();

  try {
    const sessionData = await getCurrentUserSession();
    if (!sessionData) {
      window.location.href = "login.html";
      return;
    }

    currentSession = sessionData.session;
    currentUserProfile = sessionData.profile;

    // Verify status is approved
    if (currentUserProfile.status !== 'approved') {
      window.location.href = "login.html";
      return;
    }

    // Show layout
    document.getElementById("portalLayout").style.display = "flex";

    // Setup Sidebar info
    updateSidebarProfileUI();

    // Load first tab content
    switchPortalTab('feed');

    // Initialize admin notification badges
    await updateAdminBadges();

  } catch (e) {
    console.error("Session load error:", e);
    window.location.href = "login.html";
  }
});

function updateSidebarProfileUI() {
  const sideAvatar = document.getElementById("sideAvatar");
  const sideName = document.getElementById("sideName");
  const sideRole = document.getElementById("sideRole");
  const postBoxAvatar = document.getElementById("postBoxAvatar");
  const topbarUserGreeting = document.getElementById("topbarUserGreeting");

  // Name & Greeting
  sideName.textContent = currentUserProfile.name;
  topbarUserGreeting.textContent = currentUserProfile.alias || currentUserProfile.name.split(' ')[0];

  // Avatar preview
  const initials = currentUserProfile.name.charAt(0).toUpperCase();
  if (currentUserProfile.picture_url) {
    const imgTag = `<img src="${currentUserProfile.picture_url}" alt="${currentUserProfile.name}">`;
    sideAvatar.innerHTML = imgTag;
    if (postBoxAvatar) postBoxAvatar.innerHTML = imgTag;
  } else {
    sideAvatar.textContent = initials;
    if (postBoxAvatar) postBoxAvatar.textContent = initials;
  }

  // Role
  if (currentUserProfile.role === 'developer') {
    sideRole.textContent = "🛠 Developer";
    sideRole.className = "sidebar-role-badge developer";
    document.getElementById("tabBtn_admin").style.display = "flex";
  } else if (currentUserProfile.role === 'admin') {
    sideRole.textContent = "Officer / Admin";
    sideRole.className = "sidebar-role-badge admin";
    document.getElementById("tabBtn_admin").style.display = "flex";
  } else {
    sideRole.textContent = "Brother";
    sideRole.className = "sidebar-role-badge user";
    document.getElementById("tabBtn_admin").style.display = "none";
  }
}

// Burger Sidebar Toggle (Responsive Mobile)
function toggleSidebar() {
  document.getElementById("portalSidebar").classList.toggle("active");
}

// Tab Switching
function switchPortalTab(tabName) {
  // Close mobile sidebar if open
  document.getElementById("portalSidebar").classList.remove("active");

  // Set Page Title
  const titleMap = {
    feed: "Home Feed",
    search: "Brothers Directory",
    profile: "My Profile",
    admin: "Chapter Control Panel"
  };
  document.getElementById("pageTitle").textContent = titleMap[tabName] || "Dashboard";

  // Toggle tab buttons
  const tabBtns = document.querySelectorAll(".sidebar-menu .menu-item");
  tabBtns.forEach(btn => btn.classList.remove("active"));
  
  const targetBtn = document.getElementById("tabBtn_" + tabName);
  if (targetBtn) targetBtn.classList.add("active");

  // Toggle tab subpanels
  const panels = document.querySelectorAll(".portal-tab-content");
  panels.forEach(p => p.classList.remove("active"));
  
  const targetPanel = document.getElementById("tab_" + tabName);
  if (targetPanel) targetPanel.classList.add("active");

  // Trigger tab-specific loaders
  if (tabName === 'feed') {
    loadFeedTab();
  } else if (tabName === 'search') {
    loadSearchTab();
  } else if (tabName === 'profile') {
    loadProfileTab();
  } else if (tabName === 'admin') {
    loadAdminTab();
    updateAdminBadges();
  }
}

/* ==========================================
   LOGOUT SYSTEM
   ========================================== */
async function handleLogout() {
  if (confirm("Are you sure you want to log out of the portal?")) {
    try {
      await logoutUser();
      window.location.href = "login.html";
    } catch (e) {
      console.error("Logout fail:", e);
      window.location.href = "login.html";
    }
  }
}

// Show disclaimer once per session (shared with login page via sessionStorage)
(function() {
  if (!sessionStorage.getItem('disclaimerDismissed')) {
    setTimeout(() => {
      const banner = document.getElementById('disclaimerBanner');
      if (banner) banner.style.transform = 'translateY(0)';
    }, 1200);
  }
})();

function dismissDisclaimer() {
  const banner = document.getElementById('disclaimerBanner');
  if (banner) {
    banner.style.transform = 'translateY(100%)';
    sessionStorage.setItem('disclaimerDismissed', '1');
  }
}

/* ==========================================
   IMAGE LIGHTBOX
   ========================================== */
function openLightbox(imageUrl) {
  const lightbox = document.getElementById('imageLightbox');
  const img = document.getElementById('lightboxImg');
  const link = document.getElementById('lightboxOpenLink');
  if (!lightbox || !img) return;

  img.src = imageUrl;
  if (link) link.href = imageUrl;
  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('imageLightbox');
  if (!lightbox) return;
  lightbox.style.display = 'none';
  const img = document.getElementById('lightboxImg');
  if (img) img.src = '';
  document.body.style.overflow = '';
}

// Close lightbox with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});
