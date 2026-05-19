/* ============================================================
   supabase-client.js — Supabase & Cloudinary Integration
   ============================================================ */

// 1. Ensure Supabase Client Library is loaded
let dbClient = null;

function getDbClient() {
  if (dbClient) return dbClient;

  const config = getAppConfig();
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    console.warn("Supabase credentials missing. App needs configuration.");
    return null;
  }

  if (typeof supabase === 'undefined') {
    console.error("Supabase SDK is not loaded. Make sure the CDN script is included in HTML.");
    return null;
  }

  dbClient = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  return dbClient;
}

/* ==========================================
   CLOUDINARY IMAGE UPLOADS
   ========================================== */

/**
 * Uploads a file directly to Cloudinary using Unsigned Upload Preset.
 * Returns the secure HTTPS URL of the uploaded image.
 */
async function uploadImageToCloudinary(file) {
  const config = getAppConfig();
  if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_UPLOAD_PRESET) {
    // If Cloudinary isn't configured, we fall back to a base64 encoded URL or a default placeholder
    console.warn("Cloudinary not configured. Converting file to base64 fallback.");
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "Failed uploading to Cloudinary");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
}

/* ==========================================
   AUTHENTICATION & USER PORTAL FLOW
   ========================================== */

/**
 * Sign up a new user or admin.
 * Register fields: email, password, username, name, tbirth (membership date), alias, batchname, role, and picture.
 */
async function registerUser({ email, password, username, name, tbirth, alias, batchname, role, pictureFile }) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  let pictureUrl = "";
  if (pictureFile) {
    try {
      pictureUrl = await uploadImageToCloudinary(pictureFile);
    } catch (e) {
      throw new Error("Failed to upload profile picture: " + e.message);
    }
  }

  // 1. Sign Up in Supabase Auth
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.toLowerCase().trim(),
        name: name.trim(),
        tbirth: tbirth,
        alias: alias.trim(),
        batchname: batchname.trim(),
        role: role,
        picture_url: pictureUrl,
        status: 'pending_approval'
      }
    }
  });

  if (error) throw error;
  
  const user = data.user;
  if (!user) throw new Error("Registration failed. No user returned.");

  // 2. Insert Profile into public.profiles immediately (bypassing OTP)
  const { error: profileError } = await client.from('profiles').upsert({
    id: user.id,
    username: username.toLowerCase().trim(),
    email: email.trim(),
    role: role || 'user',
    status: 'pending_approval',
    name: name.trim(),
    tbirth: tbirth,
    alias: alias.trim() || '',
    batchname: batchname.trim(),
    picture_url: pictureUrl || ''
  });

  if (profileError) {
    console.error("Error creating public profile:", profileError);
    throw profileError;
  }

  // Write log of registration
  await logSystemAction(user.id, email, 'USER_REGISTER', `User ${name.trim()} successfully registered and is pending admin approval.`);

  // Since we disabled email verification, the user is auto-logged in. 
  // We must sign them out immediately so they stay in login screen pending approval!
  await client.auth.signOut();

  return data;
}

/**
 * Verify OTP entered by user after registration
 */
async function verifyRegistrationOtp(email, token) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  // Verify OTP
  const { data, error } = await client.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'signup'
  });

  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("Verification failed. User object is null.");

  // 2. Insert Profile into public.profiles
  const meta = user.user_metadata;
  const { error: profileError } = await client.from('profiles').upsert({
    id: user.id,
    username: meta.username,
    email: user.email,
    role: meta.role || 'user',
    status: 'pending_approval',
    name: meta.name,
    tbirth: meta.tbirth,
    alias: meta.alias || '',
    batchname: meta.batchname,
    picture_url: meta.picture_url || ''
  });

  if (profileError) {
    console.error("Error creating public profile after OTP verification:", profileError);
    throw profileError;
  }

  // Write log of registration
  await logSystemAction(user.id, user.email, 'USER_REGISTER', `User ${meta.name} successfully verified OTP and is pending admin approval.`);

  return data;
}

/**
 * Resend registration OTP code to user's email
 */
async function resendRegistrationOtp(email) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const { error } = await client.auth.resend({
    type: 'signup',
    email: email.trim()
  });

  if (error) throw error;
}

/**
 * Log system audit records
 */
async function logSystemAction(userId, userEmail, action, details) {
  const client = getDbClient();
  if (!client) return;

  try {
    await client.from('logs').insert({
      user_id: userId || null,
      user_email: userEmail || null,
      action,
      details
    });
  } catch (e) {
    console.error("Failed to insert audit log:", e);
  }
}

/**
 * Sign In User
 */
async function loginUser(email, password) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password: password
  });

  if (error) throw error;

  const user = data.user;
  // Fetch their profile to check their approval status
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    // If profile is missing but user exists in Auth, try to recreate it from meta
    const meta = user.user_metadata;
    if (meta && meta.username) {
      await client.from('profiles').insert({
        id: user.id,
        username: meta.username,
        email: user.email,
        role: meta.role || 'user',
        status: meta.status || 'pending_approval',
        name: meta.name,
        tbirth: meta.tbirth,
        alias: meta.alias || '',
        batchname: meta.batchname,
        picture_url: meta.picture_url || ''
      });
      // Re-fetch
      const { data: refetched } = await client.from('profiles').select('*').eq('id', user.id).single();
      return { user, profile: refetched };
    }
    throw new Error("Unable to load profile metadata. Contact Admin.");
  }

  // Log successful login
  if (profile.status === 'approved') {
    await logSystemAction(user.id, user.email, 'USER_LOGIN', `User ${profile.name} logged into the system.`);
  }

  return { user, profile };
}

/**
 * Get current session and profile
 */
async function getCurrentUserSession() {
  const client = getDbClient();
  if (!client) return null;

  const { data: { session } } = await client.auth.getSession();
  if (!session) return null;

  const { data: profile, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) return null;
  return { session, user: session.user, profile };
}

/**
 * Log out
 */
async function logoutUser() {
  const client = getDbClient();
  if (!client) return;

  const sessionData = await client.auth.getSession();
  const user = sessionData?.data?.session?.user;
  if (user) {
    await logSystemAction(user.id, user.email, 'USER_LOGOUT', `User signed out.`);
  }

  await client.auth.signOut();
}

/* ==========================================
   PORTAL MAIN FEATURES & DATA
   ========================================== */

/**
 * Fetch Home KPIs (Total Fund, Total Members)
 */
async function fetchPortalKPIs() {
  const client = getDbClient();
  if (!client) return { totalFund: 0, totalMembers: 0 };

  try {
    // 1. Total Approved Members
    const { count: memberCount } = await client
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    // 2. Sum of Contributions
    const { data: contributions } = await client
      .from('contributions')
      .select('amount');

    const totalFund = contributions 
      ? contributions.reduce((sum, item) => sum + Number(item.amount), 0)
      : 0;

    return {
      totalMembers: memberCount || 0,
      totalFund: totalFund
    };
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    return { totalFund: 0, totalMembers: 0 };
  }
}

/**
 * Post Status Updates
 */
async function createStatusPost(content, pictureFile) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const session = await getCurrentUserSession();
  if (!session) throw new Error("User not authenticated.");

  let imageUrl = null;
  if (pictureFile) {
    imageUrl = await uploadImageToCloudinary(pictureFile);
  }

  const { data, error } = await client.from('posts').insert({
    user_id: session.user.id,
    content: content.trim(),
    image_url: imageUrl
  }).select();

  if (error) throw error;

  await logSystemAction(session.user.id, session.user.email, 'POST_CREATE', `Created status post.`);
  return data;
}

/**
 * Get Status Feed (Joining profiles relation)
 */
async function getStatusFeed() {
  const client = getDbClient();
  if (!client) return [];

  const { data, error } = await client
    .from('posts')
    .select(`
      *,
      profiles:user_id (name, alias, picture_url, username)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error loading feed:", error);
    return [];
  }
  return data;
}

/**
 * Search Profiles
 */
async function searchActiveProfiles(searchQuery) {
  const client = getDbClient();
  if (!client) return [];

  let query = client
    .from('profiles')
    .select('*')
    .eq('status', 'approved');

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,alias.ilike.%${searchQuery}%,batchname.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query.order('name');
  if (error) {
    console.error("Error searching profiles:", error);
    return [];
  }
  return data;
}

/* ==========================================
   MY PROFILE & ACCOUNT ACTIONS
   ========================================== */

/**
 * Get User contributions sum & details
 */
async function getUserContributionDetails(userId) {
  const client = getDbClient();
  if (!client) return { total: 0, list: [] };

  const { data, error } = await client
    .from('contributions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching contributions:", error);
    return { total: 0, list: [] };
  }

  const total = data.reduce((sum, item) => sum + Number(item.amount), 0);
  return { total, list: data };
}

/**
 * Update current user profile
 */
async function updateUserProfile(userId, { name, tbirth, alias, batchname, email, username, password, pictureFile }) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  let imageUrl = null;
  if (pictureFile) {
    imageUrl = await uploadImageToCloudinary(pictureFile);
  }

  // 1. Update password in Supabase Auth if provided
  if (password && password.trim()) {
    const { error: authError } = await client.auth.updateUser({ password: password.trim() });
    if (authError) throw authError;
  }

  // 2. Build profile update object
  const updates = {
    name: name.trim(),
    tbirth: tbirth,
    alias: alias.trim(),
    batchname: batchname.trim(),
    email: email.trim(),
    username: username.toLowerCase().trim()
  };

  if (imageUrl) {
    updates.picture_url = imageUrl;
  }

  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select();

  if (error) throw error;

  await logSystemAction(userId, email, 'PROFILE_UPDATE', `Updated profile fields.`);
  return data;
}

/**
 * Delete User Account client side flow
 * Sets status to 'deleted', signs out user. DB Trigger automatically cleans up auth user.
 */
async function deleteUserAccount(userId, email) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  await logSystemAction(userId, email, 'ACCOUNT_DELETE', `Triggered delete account.`);

  // Mark profile status as deleted.
  // The PostgreSQL trigger on_profile_deleted will delete the auth.users entry.
  const { error } = await client
    .from('profiles')
    .update({ status: 'deleted' })
    .eq('id', userId);

  if (error) throw error;

  // Log out the session
  await client.auth.signOut();
}

/* ==========================================
   ADMIN OPERATIONS & CRUD
   ========================================== */

/**
 * Get Pending Registrations
 */
async function adminGetPendingRegistrations() {
  const client = getDbClient();
  if (!client) return [];

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error loading pending approvals:", error);
    return [];
  }
  return data;
}

/**
 * Approve pending user
 */
async function adminApproveUser(userId, adminId, adminEmail) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const { data: userProfile } = await client.from('profiles').select('name, email').eq('id', userId).single();

  const { error } = await client
    .from('profiles')
    .update({ status: 'approved' })
    .eq('id', userId);

  if (error) throw error;

  await logSystemAction(adminId, adminEmail, 'USER_APPROVE', `Approved registration for ${userProfile?.name || userId} (${userProfile?.email}).`);
}

/**
 * Reject pending user
 */
async function adminRejectUser(userId, adminId, adminEmail) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const { data: userProfile } = await client.from('profiles').select('name, email').eq('id', userId).single();

  const { error } = await client
    .from('profiles')
    .update({ status: 'rejected' })
    .eq('id', userId);

  if (error) throw error;

  await logSystemAction(adminId, adminEmail, 'USER_REJECT', `Rejected registration for ${userProfile?.name || userId} (${userProfile?.email}).`);
}

/**
 * Admin CRUD operations on Profiles
 */
async function adminGetAllProfiles() {
  const client = getDbClient();
  if (!client) return [];

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .neq('status', 'deleted')
    .order('role', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

async function adminUpsertProfile(profile) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const { data, error } = await client
    .from('profiles')
    .upsert(profile)
    .select();

  if (error) throw error;
  return data;
}

async function adminDeleteProfile(userId, adminId, adminEmail) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  await logSystemAction(adminId, adminEmail, 'ADMIN_DELETE_USER', `Admin deleted user profile ID: ${userId}`);

  const { error } = await client
    .from('profiles')
    .update({ status: 'deleted' })
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Admin CRUD operations on Contributions
 */
async function adminGetAllContributions() {
  const client = getDbClient();
  if (!client) return [];

  const { data, error } = await client
    .from('contributions')
    .select(`
      *,
      profiles:user_id (name, alias, email)
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

async function adminCreateContribution(contribution, adminId, adminEmail) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const { data, error } = await client
    .from('contributions')
    .insert(contribution)
    .select();

  if (error) throw error;

  await logSystemAction(adminId, adminEmail, 'CONTRIBUTION_CREATE', `Created contribution of ₱${contribution.amount} for user ID: ${contribution.user_id}`);
  return data;
}

async function adminUpdateContribution(id, contribution, adminId, adminEmail) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const { data, error } = await client
    .from('contributions')
    .update(contribution)
    .eq('id', id)
    .select();

  if (error) throw error;

  await logSystemAction(adminId, adminEmail, 'CONTRIBUTION_UPDATE', `Updated contribution ID: ${id}`);
  return data;
}

async function adminDeleteContribution(id, adminId, adminEmail) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const { error } = await client
    .from('contributions')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await logSystemAction(adminId, adminEmail, 'CONTRIBUTION_DELETE', `Deleted contribution ID: ${id}`);
}

/**
 * Admin CRUD operations on Posts
 */
async function adminGetAllPosts() {
  const client = getDbClient();
  if (!client) return [];

  const { data, error } = await client
    .from('posts')
    .select(`
      *,
      profiles:user_id (name, alias)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function adminDeletePost(postId, adminId, adminEmail) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const { error } = await client
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;

  await logSystemAction(adminId, adminEmail, 'POST_DELETE', `Admin deleted status post ID: ${postId}`);
}

/**
 * Admin Audit Logs Viewer
 */
async function adminGetAllLogs() {
  const client = getDbClient();
  if (!client) return [];

  const { data, error } = await client
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * ==========================================
 * CONTACT FORM MESSAGE OPERATIONS
 * ==========================================
 */

async function submitContactMessage(messageData) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const { data, error } = await client
    .from('messages')
    .insert(messageData)
    .select();

  if (error) throw error;
  return data;
}

async function adminGetAllMessages() {
  const client = getDbClient();
  if (!client) return [];

  const { data, error } = await client
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function adminDeleteMessage(id, adminId, adminEmail) {
  const client = getDbClient();
  if (!client) throw new Error("Supabase client not initialized.");

  const { error } = await client
    .from('messages')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await logSystemAction(adminId, adminEmail, 'MESSAGE_DELETE', `Deleted contact message ID: ${id}`);
}
