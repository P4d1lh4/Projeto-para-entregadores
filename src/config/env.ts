// Environment Configuration
// This file centralizes all environment variables for the application

export const ENV = {
  // OpenAI Configuration
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  
  // Application Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Fox Route Whisperer',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Development Configuration
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // Environment Detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

// Validation function to check if required environment variables are set
export const validateEnv = () => {
  const requiredVars = ['VITE_OPENAI_API_KEY'];
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('📝 Please check your .env file and ensure all required variables are set');
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  return true;
};

// Helper function to get OpenAI API key with validation
export const getOpenAIKey = (): string => {
  const key = ENV.OPENAI_API_KEY;
  
  if (!key) {
    throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file');
  }
  
  if (!key.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. Key should start with "sk-"');
  }
  
  return key;
}; 