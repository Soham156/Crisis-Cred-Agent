// Simple test to check if ngrok works
const ngrok = require('ngrok');

(async function () {
    try {
        console.log('Testing ngrok connection...');
        console.log('This may take a moment...\n');

        const url = await ngrok.connect({
            addr: 3000,
            // No authtoken - use free tier
        });

        console.log('✅ SUCCESS!');
        console.log('ngrok URL:', url);
        console.log('\nngrok is working correctly!');
        console.log('You can now use: npm run tunnel\n');

        await ngrok.disconnect();
        await ngrok.kill();
        process.exit(0);

    } catch (error) {
        console.log('❌ ERROR:', error.message);
        console.log('\nPossible issues:');
        console.log('1. Another ngrok tunnel may be running (free tier = 1 tunnel max)');
        console.log('2. Network/firewall issues');
        console.log('3. ngrok service may be temporarily down');
        console.log('\nTry using localtunnel instead: npm run tunnel:localtunnel\n');
        process.exit(1);
    }
})();
