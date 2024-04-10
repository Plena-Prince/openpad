import React, { useState } from "react";
import "./App.css";
import { Button } from "antd";
import SendTxnModal from "./modals/SendTxnModal";
import { ethers } from "ethers";
import Header from "./components/Header";
import { usePlenaWallet } from "plena-connect-dapp-sdk";
import { convertUtf8ToHex } from "@plenaconnect/utils";
import { eip1271 } from "./helpers/eip1271";
import { hashMessage } from "./helpers/utiliities";
import SignMessageModal from "./modals/SignMessageModal";

import stakingAbi from "./helpers/staking.json";
import BUSDABI from "./helpers/BUSD.json";

function App() {
  const [pending, setPending] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [result, setResult] = useState(null);
  const { openModal, closeConnection, sendTransaction, walletAddress } =
    usePlenaWallet();

  const disconnect = async () => {
    closeConnection();
  };

  const openTxnModal = () => {
    setIsTxnModalOpen(true);
  };

  const openSignModal = () => {
    setIsSignModalOpen(true);
  };

  const closeTxnModal = () => {
    setIsTxnModalOpen(false);
    setPending(false);
    setResult(false);
  };

  const closeSignModal = () => {
    setIsSignModalOpen(false);
    setPending(false);
    setResult(false);
  };

  const cancelTransaction = () => {};

  const testSendTransaction = async () => {
    openTxnModal();
    setPending(true);

    // const AAVE_V3_POOL_POLYGON = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
    // const USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    const STAKING_CONTRACT = "0x5103E761FC51Efa06810F5053583DF9266696D0b";
    const BUSD_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
    const amount = "1000000";
    const poolID="8";

   

    const approveContract = new ethers.utils.Interface(BUSDABI);

    //Create data for approving token for lending pool
    const approveData = approveContract.encodeFunctionData("approve", [
      STAKING_CONTRACT,
      amount,
    ]);

    const lendContract = new ethers.utils.Interface(stakingAbi);

    //Create data for lending on Aave
    const lendData = lendContract.encodeFunctionData("deposit", [
      poolID,
      amount,
      
    ]);

    // Draft transaction
    const tx = {
      from: walletAddress, //Plena Wallet Address
      data: [approveData, lendData], //Encoded data for all transactions in order of execution
      to: [BUSD_ADDRESS, STAKING_CONTRACT], //Smart Contract Addresses On which the transactions has to made
      tokens: ["", ""], // Feature to be launched (Leave empty for now). The Array should be of same length as the above attributes
      amounts: ["0x0", "0x0"], //Native Token Amounts required in transaction
    };
    try {
      const res = await sendTransaction({
        chain: 56,
        method: "send_transaction",
        payload: {
          transaction: tx,
        },
      });
      if (!res?.success) {
        setResult(false);
        return;
      }
      const formattedResult = {
        method: "send_transaction",
        txHash: res?.content?.transactionHash,
        from: walletAddress,
      };
      setResult(formattedResult);
    } catch (error) {
      setResult(null);
    } finally {
      setPending(false);
    }
  };

  const testSignTransaction = async () => {
    openSignModal();
    setPending(true);
    const STAKING_CONTRACT = "0x5103E761FC51Efa06810F5053583DF9266696D0b";
    const BUSD_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
    const amount = "1000000";
    const approveContract = new ethers.utils.Interface(BUSDABI);

    //Create data for approving token for lending pool
    const approveData = approveContract.encodeFunctionData("approve", [
      STAKING_CONTRACT,
      amount,
    ]);

    const tx = {
      from: walletAddress, //Plena Wallet Address
      data: [approveData], //Encoded data for all transactions in order of execution
      to: [BUSD_ADDRESS], //Smart Contract Addresses On which the transactions has to made
      tokens: ["", ""], // Feature to be launched (Leave empty for now). The Array should be of same length as the above attributes
      amounts: ["0x0", "0x0"], //Native Token Amounts required in transaction
    };
    try {
      
      const res = await sendTransaction({
        chain: 137,
        method: "send_transaction",
        payload: {
          transaction: tx,
        },
      });
      if (!res?.success) {
        setResult(false);
        return;
      }
     
      const formattedResult = {
        method: "send_transaction",
        signature: res?.content?.signature,
        from: walletAddress,
      };
      setResult(formattedResult);
    } catch (error) {
      setResult(null);
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      {!walletAddress ? (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="mb-8 text-2xl font-bold">Welcome to Plena Connect</h1>
          <Button
            type="primary"
            onClick={openModal}
            className="text-sm font-bold"
          >
            Connect
          </Button>
        </div>
      ) : (
        <div className="h-100 flex justify-center items-center">
          <div className=" h-4/5 w-72 border-3 border-solid border-[#985AFF] rounded-2xl">
            <Header disconnect={disconnect} walletAddress={walletAddress} />
            <div className="flex flex-col items-center justify-center ">
              <h1 className="mb-8 text-2xl  mt-20">Methods</h1>
              <div className="flex flex-col h-auto">
                <Button
                  type="primary"
                  onClick={testSignTransaction}
                  className="text-sm  mx-2 bg-985AFF px-20 py-5 flex justify-center items-center"
                >
                  Only Approve
                </Button>
                <Button
                  type="primary"
                  onClick={testSendTransaction}
                  cancelTransaction={cancelTransaction}
                  className="text-sm  mx-2  mt-5 bg-985AFF px-10 py-5 flex justify-center items-center"
                >
                  Approve and deposit
                </Button>
                <Button
                  type="primary"
                  onClick={disconnect}
                  className="text-sm  mx-2 font-bold bg-white hover:bg-985AFF text-[#985AFF] border-2 border-solid border-[#985AFF] mt-40 px-10 py-5 flex justify-center items-center"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <SendTxnModal
        isModalOpen={isTxnModalOpen}
        onCancel={closeTxnModal}
        pendingRequest={pending}
        result={result}
      />
      <SignMessageModal
        isModalOpen={isSignModalOpen}
        onCancel={closeSignModal}
        pendingRequest={pending}
        result={result}
      />
    </>
  );
}

export default App;
