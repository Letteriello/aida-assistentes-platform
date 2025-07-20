import { z } from 'zod';

// Schema for environment variables validation
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),
  
  // Supabase (if used)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL').optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // API Keys
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // WhatsApp Integration
  WHATSAPP_API_URL: z.string().url().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  
  // Email Service
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional().default('3000'),
  
  // File Upload
  MAX_FILE_SIZE: z.string().optional().default('10485760'), // 10MB
  UPLOAD_DIR: z.string().optional().default('./uploads'),
});

// Validate environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, data: env, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return { success: false, data: null, errors };
    }
    
    return { 
      success: false, 
      data: null, 
      errors: [{ field: 'unknown', message: 'Unknown validation error' }] 
    };
  }
}

// Validate on module load
const envValidation = validateEnv();

if (!envValidation.success) {
  console.error('❌ Environment validation failed:');
  envValidation.errors?.forEach(error => {
    console.error(`  - ${error.field}: ${error.message}`);
  });
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Environment validation failed in production');
  }
}

// Export validated environment variables
export const env = envValidation.data || ({} as z.infer<typeof envSchema>);

// Export validation function for testing
export { validateEnv };

// Type for environment variables
export type Env = z.infer<typeof envSchema>;