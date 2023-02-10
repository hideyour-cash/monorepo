const nearAPI = require("near-api-js");
const { BN, KeyPair } = require("near-workspaces");
const fs = require("fs");
const crypto = require("crypto");

const {
  connect,
  keyStores,
  accountCreator: { UrlAccountCreator },
  providers,
} = nearAPI;

const { buildCommitments } = require("./prepareCommitments");

module.exports = { testnetSetup };

async function testnetSetup() {
  // set connection
  const CREDENTIALS_DIR = ".near-credentials";
  const keyStore = new keyStores.UnencryptedFileSystemKeyStore(CREDENTIALS_DIR);

  const config = {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://explorer.testnet.near.org",
    deps: { keyStore },
  };

  const near = await connect(config);
  const accountCreator = new UrlAccountCreator(near, config.helperUrl);

  let last_block = await near.connection.provider.block({ finality: "final" });
  let last_block_height = last_block.header.height;

  // save all base accounts to be created
  const random_prefix = crypto.randomBytes(10).toString("hex");
  const contractAccount = await createAccount(
    accountCreator,
    config,
    near,
    random_prefix + "hyctest.testnet"
  );
  const user1 = await createAccount(
    accountCreator,
    config,
    near,
    random_prefix + "user1.testnet"
  );
  const user2 = await createAccount(
    accountCreator,
    config,
    near,
    random_prefix + "user2.testnet"
  );
  const user3 = await createAccount(
    accountCreator,
    config,
    near,
    random_prefix + "user3.testnet"
  );
  const user4 = await createAccount(
    accountCreator,
    config,
    near,
    random_prefix + "user4.testnet"
  );
  const receiver = await createAccount(
    accountCreator,
    config,
    near,
    random_prefix + "receiver.testnet"
  );

  // deploy and initialize contract
  const contractWasm = fs.readFileSync("../out/contract.wasm");
  await contractAccount.deployContract(contractWasm);

  const verifyKey = JSON.parse(
    fs.readFileSync("../../circuits/out/verification_key.json")
  );

  await contractAccount.functionCall({
    contractId: contractAccount.accountId,
    methodName: "new",
    args: {
      owner: contractAccount.accountId,
      authorizer: "proxy.hapi-npo.testnet",
      max_risk: 5,
      height: 20,
      last_roots_len: 50,
      zero_value:
        "21663839004416932945382355908790599225266501822907911457504978515578255421292",
      height_wl: 20,
      last_roots_len_wl: 50,
      deposit_value: "10000000000000000000000000",
      power: verifyKey.power.toString(),
      n_public: verifyKey.nPublic.toString(),
      q_m: {
        x: verifyKey.Qm[0],
        y: verifyKey.Qm[1],
      },
      q_l: {
        x: verifyKey.Ql[0],
        y: verifyKey.Ql[1],
      },
      q_r: {
        x: verifyKey.Qr[0],
        y: verifyKey.Qr[1],
      },
      q_o: {
        x: verifyKey.Qo[0],
        y: verifyKey.Qo[1],
      },
      q_c: {
        x: verifyKey.Qc[0],
        y: verifyKey.Qc[1],
      },
      s_1: {
        x: verifyKey.S1[0],
        y: verifyKey.S1[1],
      },
      s_2: {
        x: verifyKey.S2[0],
        y: verifyKey.S2[1],
      },
      s_3: {
        x: verifyKey.S3[0],
        y: verifyKey.S3[1],
      },
      k_1: verifyKey.k1,
      k_2: verifyKey.k2,
      x_2: {
        x: [verifyKey.X_2[0][0], verifyKey.X_2[0][1]],
        y: [verifyKey.X_2[1][0], verifyKey.X_2[1][1]],
      },
      q: "21888242871839275222246405745257275088548364400416034343698204186575808495617",
      qf: "21888242871839275222246405745257275088696311157297823662689037894645226208583",
      w1: verifyKey.w,
    },
    gas: "300000000000000",
  });

  // seed with deposits and withdrawals
  await buildCommitments(
    config,
    contractAccount,
    user1,
    user2,
    user3,
    user4,
    receiver
  );

  const proofInputs = readInputs();

  await registerUser(contractAccount, user1);
  await registerUser(contractAccount, user2);
  await registerUser(contractAccount, user3);
  await registerUser(contractAccount, user4);
  await registerUser(contractAccount, receiver);

  await deposit(contractAccount, user1, proofInputs.commitment1);
  await deposit(contractAccount, user2, proofInputs.commitment2);
  await deposit(contractAccount, user3, proofInputs.commitment3);
  await deposit(contractAccount, user4, proofInputs.commitment4);

  console.log(
    "WITHDRAAAAAW",
    JSON.stringify(
      contractAccount,
      user1,
      receiver,
      null,
      proofInputs.proof1,
      proofInputs.public1
    )
  );

  await withdraw(
    contractAccount,
    user1,
    receiver,
    null,
    proofInputs.proof1,
    proofInputs.public1
  );
  await withdraw(
    contractAccount,
    user2,
    receiver,
    user1,
    proofInputs.proof2,
    proofInputs.public2
  );
  await withdraw(
    contractAccount,
    user3,
    receiver,
    user1,
    proofInputs.proof3,
    proofInputs.public3
  );
  await withdraw(
    contractAccount,
    user4,
    receiver,
    user1,
    proofInputs.proof4,
    proofInputs.public4
  );

  // these calls should fail, they are being made to test
  // the indexer
  try {
    await user1.functionCall({
      contractId: contractAccount.accountId,
      methodName: "denylist",
      args: {
        account_id: receiver.accountId,
      },
      gas: "300000000000000",
    });

    await user1.functionCall({
      contractId: contractAccount.accountId,
      methodName: "denylist",
      args: {
        account_id: receiver.accountId,
      },
      gas: "1",
    });
  } catch {}

  console.log("block of creation:", last_block_height);
  console.log("contract id:", contractAccount.accountId);

  process.exit();
}

async function createAccount(accountCreator, config, near, account_id) {
  const keyPair = KeyPair.fromRandom("ed25519");
  const publicKey = keyPair.publicKey;
  await config.deps.keyStore.setKey(config.networkId, account_id, keyPair);
  try {
    await accountCreator.createAccount(account_id, publicKey);
    return await near.account(account_id);
  } catch (err) {
    if (
      err.toString().includes("TooManyRequestsError:") ||
      err.toString().includes("Error: Server Error") ||
      err
        .toString()
        .includes(
          "The server encountered a temporary error and could not complete your request.<p>Please try again in"
        )
    ) {
      await sleep(1000 * 60 * 1);
      return await createAccount(accountCreator, config, account_id);
    } else {
      throw err;
    }
  }
}

function readInputs() {
  return {
    commitment1: JSON.parse(fs.readFileSync("temp/commitment1.json")),
    commitment2: JSON.parse(fs.readFileSync("temp/commitment2.json")),
    commitment3: JSON.parse(fs.readFileSync("temp/commitment3.json")),
    commitment4: JSON.parse(fs.readFileSync("temp/commitment4.json")),
    proof1: JSON.parse(fs.readFileSync("temp/proof1.json")),
    proof2: JSON.parse(fs.readFileSync("temp/proof2.json")),
    proof3: JSON.parse(fs.readFileSync("temp/proof3.json")),
    proof4: JSON.parse(fs.readFileSync("temp/proof4.json")),
    public1: JSON.parse(fs.readFileSync("temp/public1.json")),
    public2: JSON.parse(fs.readFileSync("temp/public2.json")),
    public3: JSON.parse(fs.readFileSync("temp/public3.json")),
    public4: JSON.parse(fs.readFileSync("temp/public4.json")),
  };
}

async function registerUser(contractAccount, account) {
  return await account.functionCall({
    contractId: contractAccount.accountId,
    methodName: "allowlist",
    args: {
      account_id: account.accountId,
    },
    gas: "300000000000000",
  });
}

async function deposit(contractAccount, account, commitment) {
  return await account.functionCall({
    contractId: contractAccount.accountId,
    methodName: "deposit",
    args: {
      secrets_hash: commitment.secret_hash,
    },
    gas: "300000000000000",
    attachedDeposit: "10000000000000000000000000",
  });
}

async function withdraw(
  contractAccount,
  account,
  receiver,
  relayer,
  proof,
  publicArgs
) {
  return await account.functionCall({
    contractId: contractAccount.accountId,
    methodName: "withdraw",
    args: {
      root: publicArgs[0],
      nullifier_hash: publicArgs[1],
      recipient: receiver.accountId,
      relayer: relayer ? relayer.accountId : null,
      fee: publicArgs[4],
      refund: publicArgs[5],
      allowlist_root: publicArgs[6],
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
    },
    gas: "300000000000000",
  });
}
