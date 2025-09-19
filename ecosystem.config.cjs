// ============================================================================
// PM2 Ecosystem Configuration for Conflux DevKit - Clean Architecture
// Manages backend service and frontend development server
// ============================================================================

module.exports = {
  apps: [
    {
      name: 'conflux-backend',
      script: 'node_modules/.bin/tsx',
      args: 'src/index.ts',
      cwd: './packages/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      kill_timeout: 5000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      wait_ready: true,
      listen_timeout: 10000,
    },
    {
      name: 'conflux-frontend',
      script: 'pnpm',
      args: 'run dev',
      cwd: './packages/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        VITE_API_BASE_URL: 'http://localhost:3001',
        VITE_WS_URL: 'ws://localhost:3002',
      },
      env_production: {
        NODE_ENV: 'production',
        VITE_API_BASE_URL: 'http://localhost:3001',
        VITE_WS_URL: 'ws://localhost:3002',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      kill_timeout: 5000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:conflux-devkit/conflux-devkit.git',
      path: '/var/www/conflux-devkit',
      'pre-deploy': 'git fetch --all',
      'post-deploy':
        'pnpm install && pnpm run build && pm2 reload ecosystem.config.js --env production',
    },
  },
};
