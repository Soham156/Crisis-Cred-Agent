const { spawn } = require('child_process');
const chalk = require('chalk');
const path = require('path');

const PORT = process.env.PORT || 3000;

console.log(chalk.cyan('🚀 Starting Crisis Cred with ngrok tunnel...\n'));

// Start the Express server
console.log(chalk.gray('Starting Express server on port ' + PORT + '...\n'));
const server = spawn('node', ['server.js'], {
  stdio: 'pipe',
  env: { ...process.env, PORT }
});

// Log server output
server.stdout.on('data', (data) => {
  console.log(data.toString());
});

server.stderr.on('data', (data) => {
  console.error(data.toString());
});

// Wait for server to start, then create tunnel
setTimeout(async () => {
  console.log(chalk.gray('Starting ngrok tunnel...\n'));

  try {
    // Dynamically import ngrok
    const ngrok = require('ngrok');

    const ngrokConfig = {
      addr: PORT,
      onStatusChange: status => {
        if (status === 'closed') {
          console.log(chalk.yellow('\n⚠️  Tunnel closed'));
        }
      },
      onLogEvent: data => {
        // Suppress verbose logs
      }
    };

    // Only add authtoken if it's set and not a placeholder
    if (process.env.NGROK_AUTHTOKEN &&
      !process.env.NGROK_AUTHTOKEN.includes('your_') &&
      process.env.NGROK_AUTHTOKEN.length > 10) {
      ngrokConfig.authtoken = process.env.NGROK_AUTHTOKEN;
    }

    const url = await ngrok.connect(ngrokConfig);

    console.log('\n' + chalk.green('━'.repeat(60)));
    console.log(chalk.green.bold('✅ ngrok tunnel established!'));
    console.log(chalk.green('━'.repeat(60)));
    console.log(chalk.yellow('📡 Public URL: ') + chalk.cyan.bold(url));
    console.log(chalk.yellow('🔗 Webhook URL: ') + chalk.cyan.bold(`${url}/webhook`));
    console.log(chalk.green('━'.repeat(60)));
    console.log(chalk.gray('\n💡 Use this webhook URL in your WhatsApp Cloud API configuration'));

    if (!ngrokConfig.authtoken) {
      console.log(chalk.yellow('\n⚠️  Running without authtoken (free tier with limits)'));
      console.log(chalk.gray('   To remove limits and get a stable URL:'));
      console.log(chalk.gray('   1. Sign up at https://dashboard.ngrok.com/signup (free)'));
      console.log(chalk.gray('   2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken'));
      console.log(chalk.gray('   3. Add to .env file: NGROK_AUTHTOKEN=your_token_here'));
    } else {
      console.log(chalk.green('\n✅ Using authtoken - unlimited sessions!'));
    }
    console.log('\n' + chalk.gray('Press Ctrl+C to stop the server and tunnel\n'));

    // Cleanup on exit
    const cleanup = async () => {
      console.log(chalk.yellow('\n\n🛑 Shutting down...'));
      try {
        await ngrok.kill();
      } catch (e) {
        // Ignore errors during cleanup
      }
      server.kill();
      setTimeout(() => process.exit(0), 500);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    console.error(chalk.red('❌ Failed to create ngrok tunnel'));
    console.log(chalk.yellow('\n💡 Error: ') + chalk.gray(error.message));
    console.log(chalk.yellow('\n💡 Troubleshooting:'));

    if (error.message.includes('authtoken') || error.message.includes('ERR_NGROK_108')) {
      console.log(chalk.gray('  • Your authtoken may be invalid'));
      console.log(chalk.gray('  • Get a new one from https://dashboard.ngrok.com/get-started/your-authtoken'));
      console.log(chalk.gray('  • Or remove NGROK_AUTHTOKEN from .env to use free tier'));
    } else if (error.message.includes('tunnel') || error.message.includes('account')) {
      console.log(chalk.gray('  • You may have another ngrok tunnel running'));
      console.log(chalk.gray('  • Free tier allows only 1 tunnel at a time'));
      console.log(chalk.gray('  • Close other ngrok instances or upgrade your account'));
      console.log(chalk.gray('  • Check https://dashboard.ngrok.com/tunnels/agents'));
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('network')) {
      console.log(chalk.gray('  • Check your internet connection'));
      console.log(chalk.gray('  • ngrok may be temporarily unavailable'));
      console.log(chalk.gray('  • Try again in a moment'));
    } else {
      console.log(chalk.gray('  1. Make sure ngrok is installed: npm install'));
      console.log(chalk.gray('  2. Check your internet connection'));
      console.log(chalk.gray('  3. Make sure port ' + PORT + ' is not in use'));
    }

    console.log(chalk.yellow('\n💡 Alternative: ') + chalk.cyan('npm run tunnel:localtunnel'));
    console.log('');

    server.kill();
    process.exit(1);
  }
}, 3000);

// Handle server errors
server.on('error', (error) => {
  console.error(chalk.red('❌ Failed to start server:'), error.message);
  process.exit(1);
});
