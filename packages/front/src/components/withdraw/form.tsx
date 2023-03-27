import { Input } from "../input";
import { If } from "@/components/if";
import { toast } from "react-toastify";
import { RelayerFee } from "../relayer-fee";
import { useEffect, useState } from "react";
import { TicketScore } from "../ticket-score";
import type { Logger } from "hideyourcash-sdk";
import { useRelayer, useWithdraw } from "@/store";
import { WithdrawButton } from "./withdraw-button";
import { ToastCustom } from "@/components/toast-custom";
import { LoadingModal } from "@/components/modals/loading";

const transactionHashes = new URLSearchParams(window.location.search).get(
  "transactionHashes"
);

const hycTransaction = "hyc-transaction";

let totalProgress = 40;

export function Withdraw() {
  const [progress, setProgress] = useState(40);

  const {
    note,
    ticket,
    buttonText,
    errorMessage,
    withdrawScore,
    generatingProof,
    recipientAddress,
    handleNote,
    preWithdraw,
    cleanupInputs,
    poolWithdrawScore,
    handleRecipientAddress,
  } = useWithdraw();

  const {
    dynamicFee,
    loadingDynamicFee,
    recipientAddressError,
  } = useRelayer();

  const logger: Logger = {
    debug: (message: string) => {
      totalProgress = totalProgress + 0.37;

      setProgress(totalProgress);

      return message;
    },
  };

  if (transactionHashes) {
    localStorage.setItem(hycTransaction, JSON.stringify(true));
  }

  const handleWithdraw = async () => {
    try {
      await preWithdraw(logger);
    } catch (err) {
      console.warn(err);
      toast(
        <ToastCustom
          icon="/error-circle-icon.svg"
          title="Withdraw error"
          message="An error occured. It may be intermittent due to RPC cache, please try again in 10 minutes."
        />,
        {
          toastId: "error-toast",
        }
      );
    } finally {
      totalProgress = 40;
      setProgress(40);
    }
  };

  useEffect(() => {
    if (!ticket.contract) {
      return;
    }

    poolWithdrawScore();
  }, [ticket]);

  return (
    <div
      className="space-y-4"
    >
      <Input
        value={note}
        error={errorMessage}
        label="Withdrawal ticket"
        placeholder="Paste your withdraw ticked"
        onChange={(value) => handleNote(value as string)}
      />

      {ticket.contract && !errorMessage && (
        <TicketScore
          score={withdrawScore}
        />
      )}

      <Input
        value={recipientAddress}
        label="Recipient Address"
        placeholder="Wallet Address"
        error={recipientAddressError}
        onChange={(value) => handleRecipientAddress(value as string)}
      />

      {dynamicFee.token && !loadingDynamicFee && (
        <RelayerFee/>
      )}

      <If
        condition={!generatingProof}
        fallback={<LoadingModal loading={generatingProof} progress={progress} /> as any}
      >
        <WithdrawButton
          buttonText={buttonText}
          isLoading={loadingDynamicFee}
          onClick={() => handleWithdraw()}
          cleanupInputs={() => cleanupInputs()}
          isDisabled={!dynamicFee.token || loadingDynamicFee}
        />
      </If>
    </div>
  );
}
