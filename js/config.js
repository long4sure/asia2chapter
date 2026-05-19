/* ============================================================
   config.js — Supabase & Cloudinary Configuration
   ============================================================ */

const CONFIG = {
  // Replace these with your actual Supabase project credentials for production:
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Replace these with your Cloudinary credentials for unsigned uploads:
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_UPLOAD_PRESET: "", // Unsigned upload preset
};

// Helper function to get configuration keys, checking localStorage first
function getAppConfig() {
  const localConfig = localStorage.getItem('tgp_portal_config');
  if (localConfig) {
    try {
      const parsed = JSON.parse(localConfig);
      return {
        SUPABASE_URL: parsed.SUPABASE_URL || CONFIG.SUPABASE_URL,
        SUPABASE_ANON_KEY: parsed.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY,
        CLOUDINARY_CLOUD_NAME: parsed.CLOUDINARY_CLOUD_NAME || CONFIG.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_UPLOAD_PRESET: parsed.CLOUDINARY_UPLOAD_PRESET || CONFIG.CLOUDINARY_UPLOAD_PRESET
      };
    } catch (e) {
      console.error("Error parsing local configuration:", e);
    }
  }
  return CONFIG;
}

// Check if configuration is complete
function isConfigured() {
  const current = getAppConfig();
  return (
    current.SUPABASE_URL && 
    current.SUPABASE_ANON_KEY && 
    !current.SUPABASE_URL.includes("YOUR_") &&
    !current.SUPABASE_ANON_KEY.includes("YOUR_")
  );
}

// Save configuration to localStorage
function saveAppConfig(supabaseUrl, supabaseAnonKey, cloudinaryCloudName, cloudinaryUploadPreset) {
  const data = {
    SUPABASE_URL: supabaseUrl.trim(),
    SUPABASE_ANON_KEY: supabaseAnonKey.trim(),
    CLOUDINARY_CLOUD_NAME: cloudinaryCloudName ? cloudinaryCloudName.trim() : "",
    CLOUDINARY_UPLOAD_PRESET: cloudinaryUploadPreset ? cloudinaryUploadPreset.trim() : ""
  };
  localStorage.setItem('tgp_portal_config', JSON.stringify(data));
  console.log("Configuration saved successfully to localStorage.");
}

// Clear local configuration and reset
function clearAppConfig() {
  localStorage.removeItem('tgp_portal_config');
  window.location.reload();
}
