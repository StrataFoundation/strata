// File has weird name because https://github.com/project-serum/anchor/issues/1499
// TODO: Rename to arg.rs
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyWithBaseV0Args {
  pub base_amount: u64,
  pub minimum_target_amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyTargetAmountV0Args {
  // Number to purchase. This is including the decimal value. So 1 is the lowest possible fraction of a coin
  // Note that you will receive this amount, less target_royalties.
  // Target royalties are taken out of the total purchased amount. Base royalties inflate the purchase price.
  pub target_amount: u64,
  // Maximum price to pay for this amount. Allows users to account and fail-fast for slippage.
  pub maximum_price: u64,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyV0Args {
  pub buy_with_base: Option<BuyWithBaseV0Args>,
  pub buy_target_amount: Option<BuyTargetAmountV0Args>,
}
