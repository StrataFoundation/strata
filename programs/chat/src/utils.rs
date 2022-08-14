use crate::error::ErrorCode;
use std::io::Write;

use anchor_lang::{
  prelude::*,
  solana_program::{entrypoint::MAX_PERMITTED_DATA_INCREASE, program::invoke, system_instruction},
};

/// Pads the string to the desired size with `0u8`s.
/// NOTE: it is assumed that the string's size is never larger than the given size.
pub fn puffed_out_string(s: &str, size: usize) -> String {
  let mut array_of_zeroes = vec![];
  let puff_amount = size - s.len();
  while array_of_zeroes.len() < puff_amount {
    array_of_zeroes.push(0u8);
  }
  s.to_owned() + std::str::from_utf8(&array_of_zeroes).unwrap()
}

pub struct IgnoreWriter {
  pub total: usize,
}

impl Write for IgnoreWriter {
  fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
    self.total += buf.len() as usize;
    Ok(buf.len())
  }

  fn flush(&mut self) -> std::io::Result<()> {
    Ok(())
  }
}

/// Resizes the account to the size of the struct
pub fn resize_to_fit<'info, T: AccountSerialize + AccountDeserialize + Owner + Clone>(
  payer: &AccountInfo<'info>,
  system_program: &AccountInfo<'info>,
  account: &Account<'info, T>,
) -> Result<()> {
  let rent = Rent::get()?;
  let writer = &mut IgnoreWriter { total: 0 };
  account.try_serialize(writer)?;
  let new_size = writer.total + 64; // Pad enough for two pubkeys so deserialize doesn't fail
  let new_minimum_balance = rent.minimum_balance(new_size);
  let lamports_diff = new_minimum_balance.saturating_sub(account.to_account_info().lamports());
  let old_size = account.to_account_info().data.borrow().len();

  if new_size > old_size && (new_size - old_size) > MAX_PERMITTED_DATA_INCREASE {
    return Err(error!(ErrorCode::InvalidDataIncrease));
  }
  msg!("Resizing to {} with lamports {}", new_size, lamports_diff);
  invoke(
    &system_instruction::transfer(payer.key, &account.key(), lamports_diff),
    &[
      payer.clone(),
      account.to_account_info().clone(),
      system_program.clone(),
    ],
  )?;

  account.to_account_info().realloc(new_size, false)?;

  Ok(())
}
