#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Symbol, Vec, String
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Policy {
    pub id: u32,
    pub holder: Address,
    pub premium: i128,
    pub coverage: i128,
    pub policy_type: Symbol, // e.g. "health", "auto", "travel"
    pub is_active: bool,
    pub expiration: u64, // timestamp
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Claim {
    pub id: u32,
    pub policy_id: u32,
    pub claimant: Address,
    pub amount: i128,
    pub description: String,
    pub status: u32, // 0 = Pending, 1 = Approved, 2 = Rejected, 3 = Paid
    pub created_at: u64, // timestamp
}

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    PolicyCount,
    ClaimCount,
    Policy(u32),
    Claim(u32),
    UserPolicies(Address),
    UserClaims(Address),
}

#[contract]
pub struct InsuranceContract;

#[contractimpl]
impl InsuranceContract {
    pub fn initialize(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::PolicyCount, &0u32);
        env.storage().instance().set(&DataKey::ClaimCount, &0u32);
    }

    pub fn create_policy(
        env: Env,
        admin: Address,
        holder: Address,
        premium: i128,
        coverage: i128,
        policy_type: Symbol,
        duration: u64,
    ) -> u32 {
        admin.require_auth();
        
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("only admin can create policies");
        }

        let mut policy_count: u32 = env.storage().instance().get(&DataKey::PolicyCount).unwrap_or(0);
        policy_count += 1;
        env.storage().instance().set(&DataKey::PolicyCount, &policy_count);

        let expiration = env.ledger().timestamp() + duration;
        let policy = Policy {
            id: policy_count,
            holder: holder.clone(),
            premium,
            coverage,
            policy_type: policy_type.clone(),
            is_active: true,
            expiration,
        };

        env.storage().persistent().set(&DataKey::Policy(policy_count), &policy);

        // Associate policy with user
        let mut user_policies: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::UserPolicies(holder.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        user_policies.push_back(policy_count);
        env.storage().persistent().set(&DataKey::UserPolicies(holder.clone()), &user_policies);

        // Publish event
        env.events().publish(
            (Symbol::new(&env, "policy_created"), policy_count, holder),
            policy_type,
        );

        policy_count
    }

    pub fn buy_policy(
        env: Env,
        holder: Address,
        premium: i128,
        coverage: i128,
        policy_type: Symbol,
        duration: u64,
    ) -> u32 {
        holder.require_auth();

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        
        // Transfer premium from holder to the contract
        token_client.transfer(&holder, &env.current_contract_address(), &premium);

        let mut policy_count: u32 = env.storage().instance().get(&DataKey::PolicyCount).unwrap_or(0);
        policy_count += 1;
        env.storage().instance().set(&DataKey::PolicyCount, &policy_count);

        let expiration = env.ledger().timestamp() + duration;
        let policy = Policy {
            id: policy_count,
            holder: holder.clone(),
            premium,
            coverage,
            policy_type: policy_type.clone(),
            is_active: true,
            expiration,
        };

        env.storage().persistent().set(&DataKey::Policy(policy_count), &policy);

        // Associate policy with user
        let mut user_policies: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::UserPolicies(holder.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        user_policies.push_back(policy_count);
        env.storage().persistent().set(&DataKey::UserPolicies(holder.clone()), &user_policies);

        // Publish event
        env.events().publish(
            (Symbol::new(&env, "policy_created"), policy_count, holder),
            policy_type,
        );

        policy_count
    }

    pub fn file_claim(
        env: Env,
        claimant: Address,
        policy_id: u32,
        amount: i128,
        description: String,
    ) -> u32 {
        claimant.require_auth();

        let policy: Policy = env
            .storage()
            .persistent()
            .get(&DataKey::Policy(policy_id))
            .expect("policy not found");

        if policy.holder != claimant {
            panic!("only the policy holder can file claims");
        }
        if !policy.is_active {
            panic!("policy is not active");
        }
        if env.ledger().timestamp() > policy.expiration {
            panic!("policy has expired");
        }
        if amount > policy.coverage {
            panic!("claim amount exceeds policy coverage");
        }

        let mut claim_count: u32 = env.storage().instance().get(&DataKey::ClaimCount).unwrap_or(0);
        claim_count += 1;
        env.storage().instance().set(&DataKey::ClaimCount, &claim_count);

        let claim = Claim {
            id: claim_count,
            policy_id,
            claimant: claimant.clone(),
            amount,
            description: description.clone(),
            status: 0, // Pending
            created_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::Claim(claim_count), &claim);

        // Associate claim with user
        let mut user_claims: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::UserClaims(claimant.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        user_claims.push_back(claim_count);
        env.storage().persistent().set(&DataKey::UserClaims(claimant.clone()), &user_claims);

        // Publish event
        env.events().publish(
            (Symbol::new(&env, "claim_filed"), claim_count, claimant, policy_id),
            amount,
        );

        claim_count
    }

    pub fn approve_claim(env: Env, admin: Address, claim_id: u32) {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("only admin can approve claims");
        }

        let mut claim: Claim = env
            .storage()
            .persistent()
            .get(&DataKey::Claim(claim_id))
            .expect("claim not found");

        if claim.status != 0 {
            panic!("claim is not pending");
        }

        claim.status = 1; // Approved
        env.storage().persistent().set(&DataKey::Claim(claim_id), &claim);

        // Perform payout
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &claim.claimant, &claim.amount);

        claim.status = 3; // Paid
        env.storage().persistent().set(&DataKey::Claim(claim_id), &claim);

        // Publish event
        env.events().publish(
            (Symbol::new(&env, "claim_approved"), claim_id, claim.claimant),
            claim.amount,
        );
    }

    pub fn reject_claim(env: Env, admin: Address, claim_id: u32) {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("only admin can reject claims");
        }

        let mut claim: Claim = env
            .storage()
            .persistent()
            .get(&DataKey::Claim(claim_id))
            .expect("claim not found");

        if claim.status != 0 {
            panic!("claim is not pending");
        }

        claim.status = 2; // Rejected
        env.storage().persistent().set(&DataKey::Claim(claim_id), &claim);

        // Publish event
        env.events().publish(
            (Symbol::new(&env, "claim_rejected"), claim_id, claim.claimant),
            claim.amount,
        );
    }

    pub fn get_policy(env: Env, policy_id: u32) -> Option<Policy> {
        env.storage().persistent().get(&DataKey::Policy(policy_id))
    }

    pub fn get_claim(env: Env, claim_id: u32) -> Option<Claim> {
        env.storage().persistent().get(&DataKey::Claim(claim_id))
    }

    pub fn get_user_policies(env: Env, user: Address) -> Vec<u32> {
        env.storage()
            .persistent()
            .get(&DataKey::UserPolicies(user))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_user_claims(env: Env, user: Address) -> Vec<u32> {
        env.storage()
            .persistent()
            .get(&DataKey::UserClaims(user))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }
}

#[cfg(test)]
mod test;
