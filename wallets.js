const fs = require('fs');
const web3 = require("@solana/web3.js");
const { Keypair} = web3;
const bs58 = require('bs58');
const bip39 = require('bip39');
require('dotenv').config();

//verify env variables
console.log('Solana RPC Host:', process.env.QUICKNODE_RPC);

//Create conexion
const solanacon = new web3.Connection(process.env.QUICKNODE_RPC, 'confirmed');

//create wallet
const SolanaWallet = web3.Keypair.generate();
console.log('Solana Wallet:', SolanaWallet);
console.log('Solana Wallet Public Key:', SolanaWallet.publicKey);

//get arrays from wallet
const secretKeyArray = Array.from(SolanaWallet.secretKey);
const publicKeyArray = Array.from(SolanaWallet.publicKey.toBytes());

const walletInfo = {
  publicKey: publicKeyArray,
  secretKey: secretKeyArray
};

//save wallet to json file
fs.writeFileSync('./custom-wallet/'+SolanaWallet.publicKey.toBase58()+'.json', JSON.stringify(walletInfo, null, 2));

//read wallet from json file
const readWallet = JSON.parse(fs.readFileSync('./custom-wallet/'+SolanaWallet.publicKey.toBase58()+'.json').toString().trim());
console.log('Read Wallet:', readWallet);

//genereate keypair from json wallet
const SolanaWalletJson = Keypair.fromSecretKey(new Uint8Array(readWallet.secretKey));
console.log('From Wallet:', SolanaWalletJson);

// generate secret key from private key
const secretKey = Uint8Array.from(SolanaWalletJson.secretKey);
console.log(secretKey);

//generate Private Key from secret key
const SolanaWalletPrivateKey = bs58.encode(SolanaWallet.secretKey);
console.log('Private Key:', SolanaWalletPrivateKey);

//generate Mnemonic 24 words
const SolanaWalletMnemonic24 = bip39.generateMnemonic(256);
console.log('Mnemonic 24:', SolanaWalletMnemonic24);

//generate Mnemonic 24 words from private key
const seed24 = bip39.mnemonicToSeedSync(SolanaWalletMnemonic24);
const privateKey24 = seed24.slice(0, 32);
const secretKeym24 = new Uint8Array(privateKey24);
console.log('Private Key from Mnemonic 12:', secretKeym24);

//generate Mnemonic 12 private key
const SolanaWalletMnemonic24FromPrivateKey = web3.Keypair.fromSeed(secretKeym24);
console.log('Mnemonic 24 from private key:', SolanaWalletMnemonic24FromPrivateKey);

//generate Mnemonic 12 words
const SolanaWalletMnemonic12 = bip39.generateMnemonic(128);
console.log('Mnemonic 12:', SolanaWalletMnemonic12);

//generate Mnemonic 12 words from private key
const seed12 = bip39.mnemonicToSeedSync(SolanaWalletMnemonic12);
const privateKey12 = seed12.slice(0, 32);
const secretKeym12 = new Uint8Array(privateKey12);
console.log('Private Key from Mnemonic 12:', secretKeym12);

//generate Mnemonic 12 private key
const SolanaWalletMnemonic12FromPrivateKey = web3.Keypair.fromSeed(secretKeym12);
console.log('Mnemonic 12 from private key:', SolanaWalletMnemonic12FromPrivateKey);


//Wallets
const wallet1 = SolanaWallet.publicKey.toBase58();
console.log('Wallet 1:', wallet1);

const wallet2 = SolanaWalletMnemonic24FromPrivateKey.publicKey.toBase58();
console.log('Wallet 2:', wallet2);

const wallet3 = SolanaWalletMnemonic12FromPrivateKey.publicKey.toBase58();
console.log('Wallet 3:', wallet3);

//get balance all wallets
getBalance(SolanaWallet.publicKey).then((balance) => { console.log('Balance Wallet 1:', balance); });
getBalance(SolanaWalletMnemonic24FromPrivateKey.publicKey).then((balance) => { console.log('Balance Wallet 2:', balance); });
getBalance(SolanaWalletMnemonic12FromPrivateKey.publicKey).then((balance) => { console.log('Balance Wallet 3:', balance); });

//Airdrop
solanaAirdrop(SolanaWallet.publicKey).then(
  (airdropSignature) => {
    console.log('Airdrop Signature:', airdropSignature);
    //Transfer
    solanaTransfer(SolanaWallet, SolanaWalletMnemonic24FromPrivateKey, 1000000)
  }
);

async function getBalance(pubkey) {
  console.log('Pubkey:', pubkey);
  const balance = await solanacon.getBalance(pubkey); 
  return balance;
};

async function solanaAirdrop(pubkey){
  console.log(`Requesting airdrop for ${pubkey.toBase58()}`)
  const signature = await solanacon.requestAirdrop(
      pubkey,
      1000000000,
  );
  const { blockhash, lastValidBlockHeight } = await solanacon.getLatestBlockhash();
  await solanacon.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
  },'finalized');
  console.log(`Tx Complete: https://explorer.solana.com/tx/${signature}?cluster=devnet`)
  return signature;
}

async function solanaTransfer(from, to, amount){
  const transaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to.publicKey,
      lamports: amount,
    }),
  );

  // Sign transaction, broadcast, and confirm
  const signature = await web3.sendAndConfirmTransaction(
    solanacon,
    transaction,
    [from],
  );
  console.log('SIGNATURE', signature);
}
