//@ts-ignore
import { plonk } from "snarkjs";
import { parseNote } from "../helpers";
import type MerkleTree from "fixed-merkle-tree";
import { mimc as mimcService } from "../services";
import type { RelayerDataInterface } from "../interfaces";
import { viewAccountHash } from "../views";
import type {
  Logger,
  PublicArgsInterface,
  WithdrawInputInterface,
} from "../interfaces/snark-proof";

/**
 * Create snark proof
 *
 * This method is responsible for creating a new Snark Proof.
 *
 * @param payload The withdraw input to be send to plonk to calculate the proof
 * @param verifierUrl The Url of verifier.wasm
 * @param circuitUrl The Url of circuit.zkey
 * @param logger The logger instance
 * @returns {Promise<{ proof: any; publicSignals: string[] }>}
 */
export const createSnarkProof = async (
  payload: WithdrawInputInterface,
  verifierUrl = "./verifier.wasm",
  circuitUrl = "./circuit.zkey",
  logger: Logger
): Promise<{ proof: any; publicSignals: string[] }> => {
  /**
   * When is the first hit of IP on circuit.zkey, vercel returns 502. We retry to continue withdraw
   */
  try {
    const { proof, publicSignals } = await plonk.fullProve(
      payload,
      verifierUrl,
      circuitUrl,
      logger
    );

    return { proof, publicSignals };
  } catch (e) {
    console.warn(e);

    const { proof, publicSignals } = await plonk.fullProve(
      payload,
      verifierUrl,
      circuitUrl,
      logger
    );

    return { proof, publicSignals };
  }
};

/**
 * SnarkProof - Prepare Withdraw
 *
 * This method is responsible for preparing a withdraw action, generating all account hashes, creating a withdraw input and generating a new proof.
 *
 * @param nodeUrl The Current Near RPC Url
 * @param contract The instance accountId
 * @param fee The relayer fee generated of relayer
 * @param note The note to withdraw
 * @param relayer The data of relayer to be create the proof
 * @param recipient The receiver accountId of ticket amount
 * @param logger The logger instance
 * @param allowlistTree The allowlist merkle tree
 * @param commitmentsTree the commitments merkle tree
 * @param verifierUrl the url of verifier.wasm
 * @param circuitUrl the url of circuit.zkey
 * @returns {Promise<{ publicArgs: PublicArgsInterface }>}
 */
export const prepareWithdraw = async (
  nodeUrl: string,
  contract: string,
  fee: string,
  note: string,
  relayer: RelayerDataInterface,
  recipient: string,
  logger: Logger,
  allowlistTree: MerkleTree,
  commitmentsTree: MerkleTree,
  verifierUrl = "./verifier.wasm",
  circuitUrl = "./circuit.zkey"
): Promise<{ publicArgs: PublicArgsInterface }> => {
  const { hash, singleHash } = await mimcService.initMimc();

  const recipientHash = await viewAccountHash(nodeUrl, contract, recipient);
  const relayerHash = await viewAccountHash(nodeUrl, contract, relayer.account);

  const commitment = parseNote(note);

  const secretsHash = hash(commitment.secret, commitment.nullifier);

  const commitmentLeaves = hash(secretsHash, commitment.account_hash);

  const path = commitmentsTree.proof(commitmentLeaves);
  const pathWL = allowlistTree.proof(commitment.account_hash);

  const input = await getWithdrawInput(
    relayerHash,
    fee,
    recipientHash,
    path,
    pathWL,
    commitment,
    singleHash
  );

  const { proof, publicSignals } = await createSnarkProof(
    input,
    verifierUrl,
    circuitUrl,
    logger
  );

  const publicArgs = getPublicArgs(proof, relayer, publicSignals, recipient);

  return {
    publicArgs,
  };
};

/**
 * SnarkProof get commitment by ticket
 *
 * This method is responsible for generating a new commitment of a ticket.
 *
 * @param note The note to withdraw
 * @returns {Promise<string>}
 */
export const getCommitmentByTicket = async (note: string): Promise<string> => {
  const { hash } = await mimcService.initMimc();

  const parsedNote = parseNote(note);

  const secretsHash = hash(parsedNote.secret, parsedNote.nullifier);

  return hash(secretsHash, parsedNote.account_hash);
}

/**
 * SnarkProof get withdraw input
 *
 * This method is responsible for generating a withdraw input to create a new proof.
 *
 * @param hash The hash of relayer accountId
 * @param fee The relayer fee
 * @param recipientHash The receiver accountId of ticket amount
 * @param path The commitments merkle tree proof
 * @param pathAL The allowlist merkle tree proof
 * @param commitment the parsed note
 * @param single_hash The function to create a hash of nullifier of commitment
 * @returns {Promise<WithdrawInputInterface>}
 */
export const getWithdrawInput = async (
  hash: string,
  fee: string,
  recipientHash: string,
  path: any,
  pathAL: any,
  commitment: any,
  single_hash: any
): Promise<WithdrawInputInterface> => {
  return {
    fee,
    root: path.pathRoot,
    nullifierHash: single_hash(commitment.nullifier),
    recipient: recipientHash,
    relayer: hash,
    refund: "0",
    nullifier: commitment.nullifier,
    secret: commitment.secret,
    pathElements: path.pathElements,
    pathIndices: path.pathIndices,
    allowlistRoot: pathAL.pathRoot,
    originDepositor: commitment.account_hash,
    allowlistPathElements: pathAL.pathElements,
    allowlistPathIndices: pathAL.pathIndices,
  };
};

/**
 * SnarkProof get public args
 *
 * This method is responsible for returning a valid payload for a withdraw action.
 *
 * @param proof The proof generated by plonk
 * @param relayer The data of relayer to be send to withdraw
 * @param publicSignals The public signals generated by plonk
 * @param receiver The receiver accountId of ticket amount
 * @returns {Promise<PublicArgsInterface>}
 */
export const getPublicArgs = (
  proof: any,
  relayer: RelayerDataInterface,
  publicSignals: string[],
  receiver: string
): PublicArgsInterface => {
  return {
    root: publicSignals[0],
    nullifier_hash: publicSignals[1],
    recipient: receiver,
    relayer: relayer.account,
    fee: publicSignals[4],
    refund: publicSignals[5],
    allowlist_root: publicSignals[6],
    a: {
      x: proof["A"][0],
      y: proof["A"][1],
    },
    b: {
      x: proof["B"][0],
      y: proof["B"][1],
    },
    c: {
      x: proof["C"][0],
      y: proof["C"][1],
    },
    z: {
      x: proof["Z"][0],
      y: proof["Z"][1],
    },
    t_1: {
      x: proof["T1"][0],
      y: proof["T1"][1],
    },
    t_2: {
      x: proof["T2"][0],
      y: proof["T2"][1],
    },
    t_3: {
      x: proof["T3"][0],
      y: proof["T3"][1],
    },
    eval_a: proof["eval_a"],
    eval_b: proof["eval_b"],
    eval_c: proof["eval_c"],
    eval_s1: proof["eval_s1"],
    eval_s2: proof["eval_s2"],
    eval_zw: proof["eval_zw"],
    eval_r: proof["eval_r"],
    wxi: {
      x: proof["Wxi"][0],
      y: proof["Wxi"][1],
    },
    wxi_w: {
      x: proof["Wxiw"][0],
      y: proof["Wxiw"][1],
    },
  };
};
