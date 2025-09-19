#!/usr/bin/env node
// ============================================================================
// Conflux DevKit Service Manager
// Unified service orchestration with PM2, health checks, and port management
// ============================================================================

import { exec } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

class DevKitManager {
  constructor() {
    this.logsDir = join(process.cwd(), 'logs');
    this.pidFile = join(process.cwd(), '.devkit-pids.json');
    this.portConfig = {
      stateServer: 3002,
      apiServer: 3001,
      demoWebapp: 3003,
      showcaseWebapp: 3000
    };
    
    this.ensureLogsDir();
  }

  ensureLogsDir() {
    if (!existsSync(this.logsDir)) {
      mkdirSync(this.logsDir, { recursive: true });
    }
  }

  async isPortInUse(port) {
    try {
      const { stdout } = await execAsync(`netstat -tlnp | grep :${port} || true`);
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  async killProcessOnPort(port) {
    try {
      const { stdout } = await execAsync(`netstat -tlnp | grep :${port} || true`);
      const lines = stdout.trim().split('\n');
      
      for (const line of lines) {
        const match = line.match(/\s+(\d+)\/(node|tsx|vite)/);
        if (match) {
          const pid = parseInt(match[1]);
          console.log(`🧹 Killing process ${pid} on port ${port}`);
          try {
            process.kill(pid, 'SIGTERM');
            await new Promise(resolve => setTimeout(resolve, 2000));
            process.kill(pid, 'SIGKILL');
          } catch {
            // Process already dead
          }
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not clean port ${port}: ${error.message}`);
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up DevKit services...');
    
    // Kill PM2 processes
    try {
      await execAsync('pm2 stop all || true');
      await execAsync('pm2 delete all || true');
      console.log('🧹 Stopped PM2 processes');
    } catch (error) {
      console.log(`⚠️  PM2 cleanup: ${error.message}`);
    }

    // Clean up ports
    for (const [service, port] of Object.entries(this.portConfig)) {
      await this.killProcessOnPort(port);
    }

    // Clean up PID file
    if (existsSync(this.pidFile)) {
      try {
        const pids = JSON.parse(readFileSync(this.pidFile, 'utf8'));
        for (const [service, pid] of Object.entries(pids)) {
          try {
            process.kill(pid, 'SIGTERM');
          } catch {
            // Process already dead
          }
        }
      } catch {
        // Invalid PID file
      }
    }

    console.log('✅ Cleanup completed');
  }

  async start() {
    console.log('🚀 Starting Conflux DevKit services...');
    
    // Check if services are already running
    try {
      const { stdout } = await execAsync('pm2 status');
      if (stdout.includes('online') || stdout.includes('stopped')) {
        console.log('⚠️  Services are already running. Use "pnpm restart" to restart them.');
        await this.status();
        return;
      }
    } catch {
      // PM2 not running, continue with start
    }

    // Start with PM2
    try {
      await execAsync('pm2 start ecosystem.config.cjs');
      console.log('✅ PM2 services started');
      
      // Wait for services to be ready
      await this.waitForServices();
      
      this.printStatus();
    } catch (error) {
      console.error('❌ Failed to start services:', error.message);
      process.exit(1);
    }
  }

  async stop() {
    console.log('🛑 Stopping Conflux DevKit services...');
    
    try {
      await execAsync('pm2 stop all');
      console.log('✅ Services stopped');
    } catch (error) {
      console.error('❌ Failed to stop services:', error.message);
    }
  }

  async restart() {
    console.log('🔄 Restarting Conflux DevKit services...');
    
    try {
      // Check if services are running
      const { stdout } = await execAsync('pm2 status');
      if (!stdout.includes('online') && !stdout.includes('stopped')) {
        console.log('⚠️  No services running. Starting services instead...');
        await this.start();
        return;
      }

      await execAsync('pm2 restart all');
      console.log('✅ Services restarted');
      
      await this.waitForServices();
      this.printStatus();
    } catch (error) {
      console.error('❌ Failed to restart services:', error.message);
    }
  }

  async startClean() {
    console.log('🧹 Starting Conflux DevKit services with cleanup...');
    
    // Clean up first
    await this.cleanup();
    
    // Wait for ports to be released
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Start with PM2
    try {
      await execAsync('pm2 start ecosystem.config.cjs');
      console.log('✅ PM2 services started');
      
      // Wait for services to be ready
      await this.waitForServices();
      
      this.printStatus();
    } catch (error) {
      console.error('❌ Failed to start services:', error.message);
      process.exit(1);
    }
  }

  async startProd() {
    console.log('🚀 Starting Conflux DevKit services in production mode...');
    
    try {
      await execAsync('pm2 start ecosystem.production.config.cjs --env production');
      console.log('✅ Production services started');
      
      // Wait for services to be ready
      await this.waitForServices();
      
      this.printStatus();
    } catch (error) {
      console.error('❌ Failed to start production services:', error.message);
      process.exit(1);
    }
  }

  async stopProd() {
    console.log('🛑 Stopping Conflux DevKit production services...');
    
    try {
      await execAsync('pm2 stop ecosystem.production.config.cjs');
      console.log('✅ Production services stopped');
    } catch (error) {
      console.error('❌ Failed to stop production services:', error.message);
    }
  }

  async restartProd() {
    console.log('🔄 Restarting Conflux DevKit production services...');
    
    try {
      await execAsync('pm2 restart ecosystem.production.config.cjs --env production');
      console.log('✅ Production services restarted');
      
      await this.waitForServices();
      this.printStatus();
    } catch (error) {
      console.error('❌ Failed to restart production services:', error.message);
    }
  }

  async status() {
    try {
      const { stdout } = await execAsync('pm2 status');
      console.log('📊 Conflux DevKit Services Status:');
      console.log('=====================================');
      console.log(stdout);
      
      // Show detailed process info
      console.log('\n🔍 Detailed Process Information:');
      console.log('=====================================');
      const { stdout: jlist } = await execAsync('pm2 jlist');
      const processes = JSON.parse(jlist);
      
      processes.forEach(proc => {
        console.log(`\n📦 ${proc.name}:`);
        console.log(`   Status: ${proc.pm2_env.status}`);
        console.log(`   PID: ${proc.pid}`);
        console.log(`   Uptime: ${proc.pm2_env.pm_uptime ? this.formatUptime(Date.now() - proc.pm2_env.pm_uptime) : 'N/A'}`);
        console.log(`   Restarts: ${proc.pm2_env.restart_time}`);
        console.log(`   CPU: ${proc.monit ? proc.monit.cpu + '%' : 'N/A'}`);
        console.log(`   Memory: ${proc.monit ? (proc.monit.memory / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`);
        if (proc.pm2_env.status === 'errored') {
          console.log(`   ❌ Error: Process failed to start`);
        }
      });
      
      // Check health
      await this.checkHealth();
    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
    }
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async checkHealth() {
    const services = [
      { name: 'State Server', url: 'ws://localhost:3002', port: 3002, type: 'websocket' },
      { name: 'API Server', url: 'http://localhost:3001/api/health', port: 3001, type: 'http' },
      { name: 'Demo WebApp', url: 'http://localhost:3003', port: 3003, type: 'http' }
    ];

    console.log('\n🔍 Health Check:');
    for (const service of services) {
      try {
        if (service.type === 'websocket') {
          // For WebSocket, just check if port is listening
          const isListening = await this.isPortInUse(service.port);
          const status = isListening ? '🟢 Healthy' : '🔴 Unhealthy';
          console.log(`   ${service.name}: ${status} (Port ${service.port})`);
        } else {
          const response = await fetch(service.url);
          const status = response.ok ? '🟢 Healthy' : '🔴 Unhealthy';
          console.log(`   ${service.name}: ${status} (Port ${service.port})`);
        }
      } catch {
        console.log(`   ${service.name}: 🔴 Unreachable (Port ${service.port})`);
      }
    }
  }

  async waitForServices() {
    console.log('⏳ Waiting for services to be ready...');
    
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          console.log('✅ All services are ready!');
          return;
        }
      } catch {
        // Service not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('⚠️  Services may not be fully ready yet');
  }

  printStatus() {
    console.log('\n📊 Conflux DevKit Services:');
    console.log('=====================================');
    console.log('   State Server: http://localhost:3002');
    console.log('   API Server:   http://localhost:3001/api');
    console.log('   Demo WebApp:  http://localhost:3003');
    console.log('\n🔧 Development Commands:');
    console.log('   pnpm start        - Start all services (development)');
    console.log('   pnpm stop         - Stop all services');
    console.log('   pnpm restart      - Restart all services');
    console.log('   pnpm status       - Show service status and health');
    console.log('   pnpm cleanup      - Clean up and stop all');
    console.log('   pnpm logs         - View service logs');
    console.log('\n🚀 Production Commands:');
    console.log('   pnpm start:prod   - Start services (production mode)');
    console.log('   pnpm stop:prod    - Stop production services');
    console.log('   pnpm restart:prod - Restart production services');
  }

  async logs(service = 'all') {
    try {
      if (service === 'all') {
        await execAsync('pm2 logs');
      } else {
        await execAsync(`pm2 logs ${service}`);
      }
    } catch (error) {
      console.error('❌ Failed to show logs:', error.message);
    }
  }

  async showErrors() {
    console.log('🚨 Recent Errors:');
    console.log('=====================================');
    
    try {
      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);
      
      for (const proc of processes) {
        if (proc.pm2_env.status === 'errored') {
          console.log(`\n❌ ${proc.name} (PID: ${proc.pid}):`);
          console.log(`   Status: ${proc.pm2_env.status}`);
          console.log(`   Restarts: ${proc.pm2_env.restart_time}`);
          console.log(`   Last restart: ${new Date(proc.pm2_env.pm_uptime).toLocaleString()}`);
          
          // Show recent error logs
          try {
            const { stdout: errorLogs } = await execAsync(`pm2 logs ${proc.name} --err --lines 10`);
            console.log('   Recent errors:');
            console.log(errorLogs.split('\n').map(line => `   ${line}`).join('\n'));
          } catch (logError) {
            console.log('   Could not retrieve error logs');
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to get error information:', error.message);
    }
  }
}

// CLI Interface
const manager = new DevKitManager();
const command = process.argv[2];
const service = process.argv[3];

switch (command) {
  case 'start':
    manager.start();
    break;
  case 'start:clean':
    manager.startClean();
    break;
  case 'start:prod':
    manager.startProd();
    break;
  case 'stop':
    manager.stop();
    break;
  case 'stop:prod':
    manager.stopProd();
    break;
  case 'restart':
    manager.restart();
    break;
  case 'restart:prod':
    manager.restartProd();
    break;
  case 'status':
    manager.status();
    break;
  case 'cleanup':
    manager.cleanup();
    break;
  case 'logs':
    manager.logs(service);
    break;
  case 'errors':
    manager.showErrors();
    break;
  default:
    console.log(`
🚀 Conflux DevKit Service Manager

Usage: pnpm <command> [service]

Commands:
  start         Start all services with PM2 (if not running)
  start:clean   Clean up and start all services
  start:prod    Start services in production mode
  stop          Stop all services
  stop:prod     Stop production services
  restart       Restart all services (or start if not running)
  restart:prod  Restart production services
  status        Show service status and health
  cleanup       Clean up and stop all services
  logs          Show logs (optionally for specific service)
  errors        Show recent errors and failed processes

Examples:
  pnpm start          # Start services (if not running)
  pnpm start:clean    # Clean up and start services
  pnpm start:prod     # Start in production mode
  pnpm restart        # Restart services
  pnpm restart:prod   # Restart production services
  pnpm status         # Check status
  pnpm logs api-server # View specific service logs
  pnpm cleanup        # Clean up everything

Features:
  ✅ PM2 process management
  ✅ Health check monitoring
  ✅ Port conflict resolution
  ✅ Auto-restart on failure
  ✅ Structured logging
  ✅ Production ready
  ✅ Smart start/restart logic
    `);
}
