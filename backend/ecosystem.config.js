/**
 * PM2 Ecosystem Configuration - Production process management के लिए
 * यह file PM2 को बताती है कि application कैसे run करना है
 */

module.exports = {
  apps: [{
    name: 'transcript-pro-backend', // Application name
    script: './server.js', // Entry point
    instances: 'max', // Maximum instances (cluster mode)
    exec_mode: 'cluster', // Cluster mode for better performance
    watch: false, // File changes पर restart नहीं करेगा
    max_memory_restart: '1G', // Memory limit के बाद restart
    env: {
      NODE_ENV: 'production', // Production environment
      PORT: 5000, // Application port
    },
    env_production: {
      NODE_ENV: 'production' // Production specific variables
    },
    error_file: './logs/err.log', // Error logs location
    out_file: './logs/out.log', // Output logs location  
    log_file: './logs/combined.log', // Combined logs location
    time: true, // Logs में timestamp add करेगा
    merge_logs: true, // Cluster logs merge करेगा
    instance_var: 'INSTANCE_ID', // Instance identification
    // Application specific settings
    node_args: [
      '--max-old-space-size=1024', // Memory limit
      '--optimize-for-size' // Optimization
    ],
    // Health check configuration
    health_check: {
      url: 'http://localhost:5000/api/health', // Health check endpoint
      interval: 30000, // 30 seconds interval
      timeout: 5000, // 5 seconds timeout
      retries: 3 // 3 retries
    }
  }, {
    name: 'transcript-pro-worker', // Background workers के लिए
    script: './workers/main.js', // Worker script
    instances: 2, // 2 worker instances
    exec_mode: 'cluster', // Cluster mode
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/worker-err.log',
    out_file: './logs/worker-out.log'
  }],

  // Deployment Configuration (यदि auto deployment चाहिए)
  deploy: {
    production: {
      user: 'ubuntu', // Server user
      host: ['your-server-ip'], // Server IP addresses
      ref: 'origin/main', // Git branch
      repo: 'git@github.com:your-username/transcript-pro.git', // Git repository
      path: '/var/www/transcript-pro', // Deployment path
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production', // Post-deploy commands
      'pre-setup': 'apt-get install git && npm install -g pm2' // Pre-setup commands
    }
  }
};
