
import {
  createTicket,
  prepareMerkleTree,
  prepareWithdraw as prepareWithdrawAction,
  sendAllowlist,
  sendDeposit,
  sendWithdraw
} from "@/actions";
import {
  lastDepositQuery,
  depositUpdatesQuery,
  allowListUpdatesQuery,
  lastAllowListQuery,
} from "@/graphql";
import { MerkleTreeCacheInterface, PublicArgsInterface, RelayerDataInterface } from "@/interfaces";
import { WalletSelector } from "@near-wallet-selector/core";
import { Views } from "./views";
// import { Account } from "near-api-js";

export class Actions extends Views {
  readonly nodeUrl: string;
  readonly contract: string;
  readonly graphqlUrl: string;

  constructor (
    nodeUrl: string,
    contract: string,
    graphqlUrl: string,
  ) {
    super(nodeUrl, contract);

    this.nodeUrl = nodeUrl;
    this.contract = contract;
    this.graphqlUrl = graphqlUrl;
  }

  async sendAllowlist (
    accountId: string,
    connection: WalletSelector,
  ) {
    return sendAllowlist(
      this.contract,
      accountId,
      connection,
    );
  }

  async createTicket (
    accountId: string,
    currencieContract: string,
  ) {
    return createTicket(
      this.nodeUrl,
      this.contract,
      accountId,
      currencieContract,
    );
  }

  async sendDeposit (
    hash: string,
    amount: string,
    contract: string,
    accountId: string,
    connection: WalletSelector,
  ) {
    return sendDeposit(
      hash,
      amount,
      contract,
      accountId,
      connection,
    );
  }

  async sendWithdraw (
    relayerUrl: string,
    publicArgs: PublicArgsInterface,
  ) {
    return sendWithdraw(
      relayerUrl,
      publicArgs,
    );
  }

  async prepareWithdraw (
    note: string,
    relayer: RelayerDataInterface,
    recipient: string,
    allowlistTreeCache?: MerkleTreeCacheInterface,
    commitmentsTreeCache?: MerkleTreeCacheInterface,
  ) {
    const allowlistTree = await prepareMerkleTree(
      'allowlistTree',
      allowListUpdatesQuery,
      lastAllowListQuery,
      this.graphqlUrl,
      allowlistTreeCache,
    );

    const commitmentsTree = await prepareMerkleTree(
      'commitmentsTree',
      depositUpdatesQuery,
      lastDepositQuery,
      this.graphqlUrl,
      commitmentsTreeCache,
    );

    const { publicArgs } = await prepareWithdrawAction(
      this.nodeUrl,
      this.contract,
      note,
      relayer,
      recipient,
      allowlistTree,
      commitmentsTree,
    );

    return publicArgs;
  }
}
