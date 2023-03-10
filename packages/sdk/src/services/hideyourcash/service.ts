import { Actions } from "./actions";

export class HideyourCash extends Actions {
  readonly network: string;
  readonly nodeUrl: string;
  readonly contract: string;
  readonly graphqlUrl?: string;

  constructor(
    network: string,
    nodeUrl: string,
    contract: string,
    graphqlUrl?: string,
    verifierUrl = "./verifier.wasm",
    circuitUrl = "./circuit.zkey"
  ) {
    super(nodeUrl, contract, graphqlUrl, verifierUrl, circuitUrl);

    this.network = network;
    this.nodeUrl = nodeUrl;
    this.contract = contract;
    this.connection = connection;
    this.graphqlUrl = graphqlUrl;
  }
}
