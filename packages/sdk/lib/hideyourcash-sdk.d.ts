// Generated by dts-bundle-generator v7.2.0

import { WalletSelector } from '@near-wallet-selector/core';
import BN from 'bn.js';
import MerkleTree from 'fixed-merkle-tree';
import { MerkleTree as FixedMerkleTree } from 'fixed-merkle-tree';

export declare const viewWasNullifierSpent: (nodeUrl: string, contract: string, nullifier: string) => Promise<any>;
export declare const viewIsInAllowlist: (rpcUrl: string, contract: string, accountId: string) => Promise<any>;
export declare const viewAccountHash: (rpcUrl: string, contract: string, accountId: string) => Promise<any>;
export declare const viewRelayerData: (relayerUrl: string) => Promise<any>;
export declare const viewRelayerHash: (rpcUrl: string, contract: string, relayer: any) => Promise<any>;
export declare const viewAllCurrencies: (rpcUrl: string, contract: string) => Promise<any>;
export declare const viewCurrencyContracts: (rpcUrl: string, contract: string) => Promise<any>;
export declare const viewIsContractAllowed: (rpcUrl: string, contract: string, accountId: string) => Promise<any>;
export declare const viewIsAllowlistRootValid: (rpcUrl: string, contract: string, root: string) => Promise<any>;
export declare const viewIsWithdrawValid: (rpcUrl: string, contract: string, payload: any) => Promise<boolean>;
export declare const createTicket: (nodeRpcUrl: string, contract: string, accountId: string, currencieContract: string) => Promise<{
	note: string;
	hash: string;
}>;
export declare const sendDeposit: (hash: string, amount: string, contract: string, accountId: string, connection: WalletSelector) => Promise<void>;
export interface FungibleTokenMetadataInterface {
	spec: string;
	name: string;
	symbol: string;
	icon: string | null;
	reference: string | null;
	reference_hash: string | null;
	decimals: number;
}
export type NFTContractMetadataInterface = {
	spec: string;
	name: string;
	symbol: string;
	icon: string | null;
	base_uri: string | null;
	reference: string | null;
	reference_hash: string | null;
};
export type TokenMetadataInterface = {
	title: string | null;
	description: string | null;
	media: string | null;
	media_hash: string | null;
	copies: number | null;
	issued_at: number | null;
	expires_at: number | null;
	starts_at: number | null;
	updated_at: number | null;
	extra: string | null;
	reference: string | null;
	reference_hash: string | null;
};
export type Token = {
	token_id: string;
	owner_id: string;
	metadata: TokenMetadataInterface;
};
export declare const foo = "";
export interface MerkleTreeStorageInterface {
	__typename: string;
	id: string;
	contract: string;
	index: string;
	signer: string;
	value: string;
	counter: string;
}
export interface MerkleTreeCacheInterface {
	lastIndex: number;
	branches: MerkleTreeStorageInterface[];
}
export interface PublicArgsInterface {
	root: string;
	nullifier_hash: string;
	recipient: string;
	relayer: string;
	fee: string;
	refund: string;
	allowlist_root: string;
	a: any;
	b: any;
	c: any;
	z: any;
	t_1: any;
	t_2: any;
	t_3: any;
	eval_a: string;
	eval_b: string;
	eval_c: string;
	eval_s1: string;
	eval_s2: string;
	eval_zw: string;
	eval_r: string;
	wxi: any;
	wxi_w: any;
}
export interface WithdrawInputInterface {
	fee: string;
	root: string;
	refund: string;
	secret: string;
	relayer: string;
	nullifier: string;
	recipient: string;
	pathIndices: string;
	pathElements: string;
	whitelistRoot: string;
	nullifierHash: string;
	originDepositor: string;
	whitelistPathIndices: string;
	whitelistPathElements: string;
}
export interface ParseNoteInterface {
	secret: string;
	nullifier: string;
	account_hash: string;
}
export declare const sendWithdraw: (relayerUrl: string, publicArgs: PublicArgsInterface) => Promise<Response>;
export declare const sendAllowlist: (contract: string, accountId: string, connection: WalletSelector) => Promise<void>;
export declare const createSnarkProof: (payload: any) => Promise<{
	proof: any;
	publicSignals: any;
}>;
export declare const prepareWithdraw: (note: string, relayer: any, recipient: string, allowlistTree: MerkleTree, commitmentsTree: MerkleTree) => Promise<{
	publicArgs: PublicArgsInterface;
}>;
export declare const getWithdrawInput: (relayer: any, parsedNote: any, recipientHash: any, allowlistProof: any, commitmentProof: any) => WithdrawInputInterface;
export declare const getPublicArgs: (proof: any, relayer: any, publicSignals: any, recipient: string) => PublicArgsInterface;
export declare const prepareMerkleTree: (name: string, branchesQuery: any, lastBranchesQuery: any, graphqlUrl: string, cache?: MerkleTreeCacheInterface) => Promise<import("fixed-merkle-tree").MerkleTree>;
export type IntoBigInt = string | number | bigint | boolean | BN;
export declare class MimcSponge {
	sponge: any;
	constructor();
	initMimc(): Promise<void>;
	hash(left: IntoBigInt, right: IntoBigInt): string;
	singleHash(single: IntoBigInt): string;
}
export declare const mimc: MimcSponge;
export declare class MerkleTreeService {
	readonly name: string;
	readonly graphqlUrl: string;
	readonly branchesQuery: any;
	readonly lastBranchesQuery: any;
	tree: any | undefined;
	constructor(name: string, graphqlUrl: string, branchesQuery: any, lastBranchesQuery: any);
	initMerkleTree(cache?: MerkleTreeCacheInterface): Promise<{
		tree: FixedMerkleTree;
	}>;
	getBranches(cache?: MerkleTreeCacheInterface): Promise<any[]>;
	getLastBranchIndex(): Promise<number>;
	getMerkleTreeBranchesWithQuery(name: string, query: any, variables?: any): Promise<any>;
}
declare class Views {
	readonly contract: string;
	readonly nodeUrl: string;
	constructor(nodeUrl: string, contract: string);
	viewIsInAllowlist(accountId: string): Promise<any>;
	viewAccountHash(accountId: string): Promise<any>;
	viewAllCurrencies(): Promise<any>;
	viewCurrencyContracts(): Promise<any>;
	viewIsContractAllowed(contract: string): Promise<any>;
	viewIsAllowlistRootValid(root: string): Promise<any>;
	viewRelayerHash(relayer: any): Promise<any>;
	viewIsWithdrawValid(payload: PublicArgsInterface): Promise<boolean>;
	viewWasNullifierSpent(nullifier: string): Promise<any>;
	viewRelayers(network?: "test" | "prod"): Promise<any[]>;
}
declare class Actions extends Views {
	readonly nodeUrl: string;
	readonly contract: string;
	readonly graphqlUrl: string;
	constructor(nodeUrl: string, contract: string, graphqlUrl: string);
	sendAllowlist(accountId: string, connection: WalletSelector): Promise<void>;
	createTicket(accountId: string, currencieContract: string): Promise<{
		note: string;
		hash: string;
	}>;
	sendDeposit(hash: string, amount: string, contract: string, accountId: string, connection: WalletSelector): Promise<void>;
	sendWithdraw(relayerUrl: string, publicArgs: PublicArgsInterface): Promise<Response>;
	prepareWithdraw(note: string, relayer: string, recipient: string, allowlistTreeCache?: MerkleTreeCacheInterface, commitmentsTreeCache?: MerkleTreeCacheInterface): Promise<PublicArgsInterface>;
}
export type fn = () => Promise<any>;
export declare class HideyourCash extends Actions {
	readonly network: string;
	readonly nodeUrl: string;
	readonly contract: string;
	readonly graphqlUrl: string;
	constructor(network: string, nodeUrl: string, contract: string, graphqlUrl: string);
}

export {};
