// ESLint rule overrides for non-critical warnings
// Add this to your eslint.config.js to suppress certain warnings

const eslintRuleOverrides = {
  rules: {
    // Suppress UI component export warnings (these are shadcn/ui components)
    'react-refresh/only-export-components': ['warn', { 
      allowConstantExport: true,
      allowExportNames: ['variants'] 
    }],
    
    // Allow empty interfaces for extensibility
    '@typescript-eslint/no-empty-object-type': ['error', {
      allowInterfaces: 'with-single-extends'
    }],
    
    // Allow any types in edge functions (Deno environment)
    '@typescript-eslint/no-explicit-any': ['error', {
      ignoreRestArgs: true,
      fixToUnknown: false
    }],
    
    // Allow require imports in config files
    '@typescript-eslint/no-require-imports': ['error', {
      allow: ['tailwindcss/plugin']
    }]
  },
  
  // Override for specific files
  overrides: [
    {
      files: ['supabase/functions/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn', // Allow any in edge functions
        '@typescript-eslint/triple-slash-reference': 'off' // Allow in Deno
      }
    },
    {
      files: ['src/components/ui/**/*.tsx'],
      rules: {
        'react-refresh/only-export-components': 'warn' // shadcn/ui components
      }
    },
    {
      files: ['*.config.{js,ts}'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off' // Config files
      }
    }
  ]
};

module.exports = eslintRuleOverrides;
