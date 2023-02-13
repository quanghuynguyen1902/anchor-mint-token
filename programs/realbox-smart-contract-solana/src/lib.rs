use anchor_lang::prelude::*;
use anchor_spl::token;

pub mod errors;
pub mod instructions;
use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod realbox_smart_contract_solana {
    use super::*;
    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        mint_token::handler(ctx, amount)
    }

}
