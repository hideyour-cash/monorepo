use crate::*;
use near_bigint::U256;
use crate::hashes::account_hash;
use near_mimc::u256_mimc_sponge_single;

#[near_bindgen]
impl Contract {
  pub fn view_account_hash(&self, account_id: AccountId) -> U256 {
    account_hash(&account_id)
  }

  pub fn view_nullifier_hash(&self, nullifier: U256) -> U256 {
    u256_mimc_sponge_single(U256::zero(), [nullifier])[0]
  }
  
  pub fn view_commitments_root(&self) -> U256 {
    self.commitments.get_last_root()
  }

  pub fn view_whitelist_root(&self) -> U256 {
    self.whitelist.get_last_root()
  }

  pub fn view_is_in_whitelist(&self, account_id: AccountId) -> bool {
    self.whitelist.is_in_whitelist(&account_hash(&account_id))
  }

  pub fn view_was_nullifier_spent(&self, nullifier: U256) -> bool {
    self.nullifier.contains(&nullifier)
  }
}
