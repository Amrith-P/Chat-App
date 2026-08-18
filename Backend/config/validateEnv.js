// Environment Variable Validator Module
export const validateEnv = () => {
  const requiredKeys = ['JWT_SECRET'];
  const optionalDefaults = {
    PORT: '10000',
    NODE_ENV: 'development',
    CLIENT_URL: 'http://localhost:5173'
  };

  const missingKeys = requiredKeys.filter((key) => !process.env[key]);

  if (missingKeys.length > 0 && process.env.NODE_ENV === 'production') {
    console.error(`🚨 FATAL: Missing required environment variables: ${missingKeys.join(', ')}`);
    console.error(`Please configure them in your environment or .env file.`);
    process.exit(1);
  } else if (missingKeys.length > 0) {
    console.warn(`⚠️ WARNING: Missing env keys: ${missingKeys.join(', ')}. Using default dev fallback values.`);
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'super_secret_jwt_key_chat_app_2026_xyz';
    }
  }

  // Set defaults for optional keys if not provided
  Object.entries(optionalDefaults).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  });

  console.log(`✅ Environment Validation Passed [NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}]`);
};

export default validateEnv;
