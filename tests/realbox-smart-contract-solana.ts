import * as anchor from "@project-serum/anchor";
import {AnchorProvider, BN, Program} from "@project-serum/anchor";
import { RealboxSmartContractSolana } from "../target/types/realbox_smart_contract_solana";
import {
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID, getMinimumBalanceForRentExemptAccount,
} from "@solana/spl-token";
import { assert } from "chai";
import {LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";

describe("realbox-smart-contract-solana", () => {
  // Configure the client to use the local cluster.
  const provider = AnchorProvider.env()
  anchor.setProvider(provider);

  // Retrieve the TokenContract struct from our smart contract
  const program = anchor.workspace.RealboxSmartContractSolana as Program<RealboxSmartContractSolana>;
  // Generate a random keypair that will represent our token
  const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
  // AssociatedTokenAccount for anchor's workspace wallet
  let associatedTokenAccount = undefined;

  it("Mint a token", async () => {
    const fromWallet = anchor.web3.Keypair.generate()

    const signature = await provider.connection.requestAirdrop(fromWallet.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature, "confirmed");


    const associatedTokenAccount = await getAssociatedTokenAddress(
        mintKey.publicKey,
        fromWallet.publicKey
    );

    // Fires a list of instructions
    const mint_tx = new anchor.web3.Transaction().add(
        // Use anchor to create an account from the mint key that we created
        anchor.web3.SystemProgram.createAccount({
          fromPubkey: fromWallet.publicKey,
          newAccountPubkey: mintKey.publicKey,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
          lamports: await getMinimumBalanceForRentExemptAccount(provider.connection),
        }),
        // Fire a transaction to create our mint account that is controlled by our anchor wallet
        createInitializeMintInstruction(
            mintKey.publicKey, 0, fromWallet.publicKey, fromWallet.publicKey
        ),
        // Create the ATA account that is associated with our mint on our anchor wallet
        createAssociatedTokenAccountInstruction(
            fromWallet.publicKey, associatedTokenAccount, fromWallet.publicKey, mintKey.publicKey
        )
    );

    // Sends and create the transaction
    await anchor.AnchorProvider.env().sendAndConfirm(mint_tx, [fromWallet, mintKey]);

    console.log("associatedTokenAccount: ", associatedTokenAccount.toString());

    await program.methods.mintToken(new BN(10)).accounts({
      mint: mintKey.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenAccount: associatedTokenAccount,
      authority: fromWallet.publicKey,
    }).signers([fromWallet]).rpc();
    // console.log("mint_tx: ", mint_tx);
    const minted = await getTokenBalance(associatedTokenAccount, provider)
    assert.equal(minted, 10)
    console.log("here")
  });
});

export  async function getTokenBalance(pubkey, provider) {
  return parseInt((await provider.connection.getTokenAccountBalance(pubkey)).value.amount);
}