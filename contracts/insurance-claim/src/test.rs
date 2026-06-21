#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String, Symbol,
};

#[test]
fn test_insurance_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let client_address = Address::generate(&env);
    let token_admin = Address::generate(&env);

    // Register the Stellar Asset Contract
    let sac = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = sac.address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    // Register Insurance Contract
    let contract_id = env.register_contract(None, InsuranceContract);
    let insurance_client = InsuranceContractClient::new(&env, &contract_id);

    // Mint tokens to client
    token_admin_client.mint(&client_address, &2000);
    // Mint tokens to contract so it can pay out claims
    token_admin_client.mint(&contract_id, &5000);

    // Initialize
    insurance_client.initialize(&admin, &token_address);

    assert_eq!(insurance_client.get_admin(), admin);
    assert_eq!(insurance_client.get_token(), token_address);

    // Purchase Policy
    let premium = 100i128;
    let coverage = 1000i128;
    let policy_type = Symbol::new(&env, "health");
    let duration = 3600u64; // 1 hour

    let policy_id = insurance_client.buy_policy(&client_address, &premium, &coverage, &policy_type, &duration);
    assert_eq!(policy_id, 1);

    // Check balances after purchase
    assert_eq!(token_client.balance(&client_address), 1900);
    assert_eq!(token_client.balance(&contract_id), 5100);

    // Verify Policy details
    let policy = insurance_client.get_policy(&policy_id).unwrap();
    assert_eq!(policy.id, 1);
    assert_eq!(policy.holder, client_address);
    assert_eq!(policy.premium, premium);
    assert_eq!(policy.coverage, coverage);
    assert_eq!(policy.policy_type, policy_type);
    assert_eq!(policy.is_active, true);

    // Verify user policy list
    let user_policies = insurance_client.get_user_policies(&client_address);
    assert_eq!(user_policies.len(), 1);
    assert_eq!(user_policies.get(0).unwrap(), 1);

    // File a claim
    let claim_amount = 400i128;
    let claim_desc = String::from_str(&env, "Medical clinic treatment invoice");
    let claim_id = insurance_client.file_claim(&client_address, &policy_id, &claim_amount, &claim_desc);
    assert_eq!(claim_id, 1);

    // Verify Claim details
    let claim = insurance_client.get_claim(&claim_id).unwrap();
    assert_eq!(claim.id, 1);
    assert_eq!(claim.policy_id, policy_id);
    assert_eq!(claim.claimant, client_address);
    assert_eq!(claim.amount, claim_amount);
    assert_eq!(claim.status, 0); // Pending

    // Verify user claim list
    let user_claims = insurance_client.get_user_claims(&client_address);
    assert_eq!(user_claims.len(), 1);
    assert_eq!(user_claims.get(0).unwrap(), 1);

    // Admin approves claim
    insurance_client.approve_claim(&admin, &claim_id);

    // Verify status changes to paid
    let claim_after = insurance_client.get_claim(&claim_id).unwrap();
    assert_eq!(claim_after.status, 3); // Paid

    // Check balances after approval (payout should be made)
    assert_eq!(token_client.balance(&client_address), 2300); // 1900 + 400
    assert_eq!(token_client.balance(&contract_id), 4700); // 5000 + 100 - 400
}
