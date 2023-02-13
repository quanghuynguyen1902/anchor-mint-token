use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use anchor_spl::token;

#[derive(Accounts)]
pub struct MintToken<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,

    /// CHECK: This is the token account that we want to mint tokens to
    #[account(mut)]
    pub token_account: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<MintToken>,
    amount: u64,
) -> Result<()> {
    msg!("authority: {:?}", ctx.accounts.authority.to_account_info());
    msg!("mint: {:?}", ctx.accounts.mint.to_account_info());
    msg!(
            "token_account: {:?}",
            ctx.accounts.token_account.to_account_info()
        );
    // Create the MintTo struct for our context
    let cpi_accounts = token::MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    msg!("cpi_program: {:?}", cpi_program);
    // Create the CpiContent we need for the request
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    // Execute anchor's helper function to mint tokens
    token::mint_to(cpi_ctx, amount)?;

    Ok(())
}