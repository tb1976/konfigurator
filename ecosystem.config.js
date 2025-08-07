module.exports = {
  apps: [{
    name: 'konfigurator',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/konfigurator',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/konfigurator-error.log',
    out_file: '/var/log/pm2/konfigurator-out.log',
    log_file: '/var/log/pm2/konfigurator.log',
    time: true,
    watch: false,
    max_memory_restart: '500M',
    restart_delay: 4000
  }]
};
