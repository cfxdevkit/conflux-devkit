// ============================================================================
// PM2 Ecosystem Configuration for Conflux DevKit - Production
// Optimized for production deployment with built assets and clustering
// ============================================================================

module.exports = {
  apps: [
    {
      name: 'devkit-backend-api-prod',
      script: 'packages/devkit-backend/dist/api-server/standalone.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        LOG_LEVEL: 'info'
      },
      error_file: './logs/devkit-backend-api-prod-error.log',
      out_file: './logs/devkit-backend-api-prod-out.log',
      log_file: './logs/devkit-backend-api-prod-combined.log',
      time: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      min_uptime: '10s',
      max_restarts: 10
    },
    {
      name: 'devkit-backend-ws-prod',
      script: 'packages/devkit-backend/dist/state-server/standalone.js',
      cwd: './',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
        LOG_LEVEL: 'info'
      },
      error_file: './logs/devkit-backend-ws-prod-error.log',
      out_file: './logs/devkit-backend-ws-prod-out.log',
      log_file: './logs/devkit-backend-ws-prod-combined.log',
      time: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      min_uptime: '10s',
      max_restarts: 10
    },
    {
      name: 'devkit-demo-frontend-prod',
      script: 'pnpm',
      args: 'run build && npx serve -s dist -l 3000',
      cwd: './packages/devkit-demo',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        VITE_API_BASE_URL: 'http://localhost:3001/api',
        VITE_WS_URL: 'ws://localhost:3002'
      },
      error_file: './logs/devkit-demo-frontend-prod-error.log',
      out_file: './logs/devkit-demo-frontend-prod-out.log',
      log_file: './logs/devkit-demo-frontend-prod-combined.log',
      time: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      min_uptime: '10s',
      max_restarts: 5
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:conflux-devkit/conflux-devkit.git',
      path: '/var/www/conflux-devkit',
      'pre-deploy': 'git fetch --all',
      'post-deploy': 'pnpm install && pnpm run build && pm2 reload ecosystem.production.config.js --env production'
    }
  }
};