import ConfirmModal from "./confirm-modal";
import { useApplication } from "@/store";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { LoadingModal } from "@/components/modals/loading";
import {
  getLastWithdrawBeforeTheTicketWasCreated,
  getTicketInTheMerkleTree,
  GET_MOST_RECENT_DEPOSIT,
  GET_MOST_RECENT_WITHDRAW,
} from "@/utils/graphql-queries";
import { generateCommitment } from "@/utils/generate-commitment";
import { ToastCustom } from "@/components/shared/toast-custom";
import { useQuery } from "@apollo/client";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { nullifierCheck } from "@/utils/nullifierCheck";
import { useWallet } from "@/store/wallet";

interface WithDrawProps {
  ticket: string;
  address: string;
}

const transactionHashes = new URLSearchParams(window.location.search).get(
  "transactionHashes"
);

const hycTransaction = "hyc-transaction";

export function Withdraw() {
  const { data: mostRecentDeposit } = useQuery(GET_MOST_RECENT_DEPOSIT);
  const { data: mostRecentWithdraw } = useQuery(GET_MOST_RECENT_WITHDRAW);
  const [showModal, setShowModal] = useState(false);
  const [generatingProof, setGeneratinProof] = useState(false);
  const buttonText = useRef("Withdraw");

  const { prepareWithdraw, relayerData, fetchRelayerData } = useApplication();
  const { selector, accountId, toggleModal } = useWallet();
  const [statistics, setStatistics] = useState<{
    totalDeposits?: number;
    totalWithdraws?: number;
  }>();
  const withdrawSchema = yup.object().shape({
    ticket: yup
      .string()
      .min(220, "This ticket is invalid")
      .required("Invalid withdraw ticket")
      .test(
        "isValidTicket",
        "This ticket is not valid anymore",
        async (value) => !(await nullifierCheck(value, selector))
      )
      .test(
        "isStored",
        "This ticket has not been deposited yet",
        async (value) => {
          if (await nullifierCheck(value, selector)) return true;
          const commitment = generateCommitment(value);

          const ticketStored = await getTicketInTheMerkleTree(commitment!);

          if (ticketStored) {
            const lastWithdraw = await getLastWithdrawBeforeTheTicketWasCreated(
              ticketStored.timestamp
            );

            const totalDeposits =
              (+mostRecentDeposit.depositMerkleTreeUpdates[0].counter || 0) -
              +ticketStored.counter;

            const totalWithdraws =
              (mostRecentWithdraw.withdrawals[0]
                ? +mostRecentWithdraw.withdrawals[0]["counter"]
                : 0) - (+lastWithdraw.counter || 0);

            setStatistics({ totalDeposits, totalWithdraws });

            return true;
          }
          return false;
        }
      ),
    address: yup
      .string()
      .min(1, "This address is invalid")
      .required("Invalid address"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WithDrawProps>({
    resolver: yupResolver(withdrawSchema),
    mode: "onChange",
  });

  if (transactionHashes) {
    localStorage.setItem(hycTransaction, JSON.stringify(true));
  }

  const preWithdraw = async (data: WithDrawProps) => {
    try {
      buttonText.current = "Preparing your withdraw...";
      setGeneratinProof(true);
      await prepareWithdraw(selector, {
        note: data.ticket,
        recipient: data.address,
      });
      setGeneratinProof(false);
      setShowModal(true);
    } catch (err) {
      console.warn(err);
      setGeneratinProof(false);
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
    }
  };

  useEffect(() => {
    if (!relayerData) {
      fetchRelayerData();
    }
  }, []);

  return (
    <>
      <div>
        <form onSubmit={handleSubmit(preWithdraw)}>
          <div className={`mb-5`}>
            <div className="flex items-center justify-between">
              <span className="text-black text-[1.1rem] font-bold">
                Withdraw ticket{" "}
                {errors.ticket?.message && (
                  <span className="text-error"> * </span>
                )}
              </span>
            </div>
            <div>
              <div>
                <input
                  className={`
                mt-2
                p-[8px]
                h-[43px]
                bg-soft-blue-normal
                rounded-[15px]
                text-dark-grafiti-light
                w-full
                flex items-center justify-between
                border-[2px]
                focus:outline-none
                ${
                  errors.ticket?.message ? "border-error" : "border-transparent"
                }
              `}
                  {...register("ticket")}
                  autoComplete="off"
                  placeholder="Paste your withdraw ticked"
                />
              </div>
              <p className="text-error mt-2 text-sm font-normal">
                {errors.ticket?.message && errors.ticket.message.toString()}
              </p>
            </div>
            {statistics && !errors.ticket?.message && (
              <div className={`flex flex-col gap-3`}>
                <div className="flex items-center justify-between">
                  <p className="text-black text-sm font-normal">
                    Total deposits to date
                  </p>
                  <p className="text-black font-bold text-sm">
                    {statistics?.totalDeposits}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-black text-sm font-normal">
                    Total withdraws to date
                  </p>
                  <p className="text-black font-bold text-sm">
                    {statistics?.totalWithdraws}
                  </p>
                </div>
              </div>
            )}

            <div className={`mt-8 ${relayerData ? "mb-6" : "mb-44"}`}>
              <div className="flex items-center justify-between">
                <span className="text-black text-[1.1rem] font-bold">
                  Recipient Address{" "}
                  {errors.address?.message && (
                    <span className="text-error"> * </span>
                  )}
                </span>
              </div>

              <div>
                <input
                  className={`
               mt-2
               p-[8px]
               h-[43px]
               bg-soft-blue-normal
               rounded-[15px]
               text-dark-grafiti-light
               w-full
               flex items-center justify-between
               border-[2px]
               focus:outline-none
               ${
                 errors.address?.message ? "border-error" : "border-transparent"
               }
             `}
                  placeholder="Wallet Address"
                  autoComplete="off"
                  {...register("address")}
                />
              </div>
              <p className="text-error mt-2 text-sm font-normal">
                {errors.address?.message?.toString()}
              </p>
            </div>
          </div>
          {relayerData && statistics && !errors.ticket?.message && (
            <div className="mt-[24px]">
              <div>
                <span className="text-black font-bold">Total</span>
              </div>

              <div className="flex flex-col w-full mt-2">
                {/* <div className="flex items-center justify-between pb-[12px]">
                <span className="text-black text-[14px]">Network fee</span>

                <span className="text-black font-bold">{`${10} NEAR`}</span>
              </div> */}

                <div className="flex items-center justify-between pb-[12px]">
                  <span className="text-black text-[14px]">Relayer fee:</span>

                  <span className="text-black font-bold">{`${
                    relayerData.feePercent * 10
                  } NEAR`}</span>
                </div>
                {/* <div className="flex items-center justify-between pb-[12px]">
                <span className="text-black text-[14px]">Total fee:</span>

                <span className="text-black font-bold">{`${
                  relayerData.feePercent
                } NEAR`}</span>
              </div> */}

                <div className="flex items-center justify-between mt-4">
                  <span className="text-black text-[14px]">
                    Tokens to receive:
                  </span>

                  <span className="text-black font-bold">{`${
                    10 * (1 - relayerData.feePercent)
                  } NEAR`}</span>
                </div>
              </div>
            </div>
          )}

          {generatingProof ? (
            <LoadingModal generatingProof={generatingProof} />
          ) : (
            <div>
              <button
                type="submit"
                className="bg-soft-blue-from-deep-blue mt-[12px] p-[12px] rounded-full w-full font-[400] hover:opacity-[.9] disabled:opacity-[.6] disabled:cursor-not-allowed"
              >
                {" "}
                {!showModal ? "Withdraw" : buttonText.current}{" "}
              </button>
            </div>
          )}
          <ConfirmModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
          />
        </form>
      </div>
      {generatingProof && (
        <div className="bg-transparent w-screen h-screen absolute -top-[40%] -left-10 sm:-left-[25%] md:-left-[35%] lg:-left-[50%] xl:-left-[108%] z-[99999] overflow-hidden" />
      )}
    </>
  );
}
