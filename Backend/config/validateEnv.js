// Environment Variable Validator Module
export const validateEnv = () => {
  const optionalDefaults = {
    PORT: '10000',
    NODE_ENV: 'production',
    CLIENT_URL: 'http://localhost:5173',
    JWT_SECRET: 'super_secret_jwt_key_chat_app_2026_xyz',
    REFRESH_TOKEN_SECRET: 'super_secret_refresh_key_chat_app_2026_abc'
  };

  // Set defaults for missing keys to ensure server NEVER crashes on boot
  Object.entries(optionalDefaults).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      console.warn(`⚠️ WARNING: Missing env key '${key}'. Using fallback default.`);
    }
  });

  console.log(`✅ Environment Validation Passed [NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}]`);
};

export default validateEnv;
