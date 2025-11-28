const localtunnel = require('localtunnel');
const { spawn } = require('child_process');
const chalk = require('chalk');

const PORT = process.env.PORT || 3000;
const SUBDOMAIN = process.env.LT_SUBDOMAIN || null; // Optional: set a custom subdomain

console.log(chalk.cyan('🚀 Starting Crisis Cred with localtunnel...\n'));

// Start the Express server
const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: { ...process.env, PORT }
});

// Wait a bit for server to start, then create tunnel
setTimeout(async () => {
    try {
        const tunnel = await localtunnel({
            port: PORT,
            subdomain: SUBDOMAIN,
        });

        console.log('\n' + chalk.green('━'.repeat(60)));
        console.log(chalk.green.bold('✅ localtunnel established!'));
        console.log(chalk.green('━'.repeat(60)));
        console.log(chalk.yellow('📡 Public URL: ') + chalk.cyan.bold(tunnel.url));
        console.log(chalk.yellow('🔗 Webhook URL: ') + chalk.cyan.bold(`${tunnel.url}/webhook`));
        console.log(chalk.green('━'.repeat(60)));
        console.log(chalk.gray('\n💡 Use this webhook URL in your WhatsApp Cloud API configuration'));
        console.log(chalk.gray('💡 This is a FREE service - no signup required!\n'));

        tunnel.on('close', () => {
            console.log(chalk.yellow('⚠️  Tunnel closed'));
            process.exit(0);
        });

        tunnel.on('error', (err) => {
            console.error(chalk.red('❌ Tunnel error:'), err.message);
        });

    } catch (error) {
        console.error(chalk.red('❌ Failed to create localtunnel:'), error.message);
        console.log(chalk.yellow('\n💡 Tips:'));
        console.log(chalk.gray('  1. Make sure localtunnel is installed: npm install'));
        console.log(chalk.gray('  2. Check your internet connection'));
        console.log(chalk.gray('  3. Try again or use ngrok instead: npm run tunnel:ngrok\n'));
        process.exit(1);
    }
}, 3000);

// Cleanup on exit
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n🛑 Shutting down...'));
    server.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n\n🛑 Shutting down...'));
    server.kill();
    process.exit(0);
});
