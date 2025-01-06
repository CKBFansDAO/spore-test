"use client"

import ConnectWallet from "@/components/ConnectWallet";
import { createSpore} from "@ckb-ccc/spore";
import { ccc } from "@ckb-ccc/connector-react";
import { useState } from "react";

export default function Home() {
  const signer = ccc.useSigner();
  const [dnaText, SetDnaText] = useState<string>("");
  const CreateSporeWithoutCluster = async () => {
    debugger
    if (!signer) return;
    if(!dnaText) return;
    // Build transaction
    let { tx, id } = await createSpore({
      signer,
      data: {
        contentType: "text/plain",
        content: ccc.bytesFrom(dnaText, "utf8"),
      },
    });
    console.log("sporeId:", id);

    // Complete transaction
    await tx.completeFeeBy(signer); // 0.001 CKB in shannons
    tx = await signer.signTransaction(tx);
    // Send transaction
    const txHash = await signer.sendTransaction(tx);
    console.log("Transaction sent:", txHash);
    await signer.client.waitTransaction(txHash);
    console.log("Transaction committed:",txHash);
  };
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <ConnectWallet></ConnectWallet>
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <input  type="text" placeholder="DOB text"  value={dnaText} onChange={(e) => SetDnaText(e.target.value)} />
        <button className="cursor-pointer rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5" onClick={async () => {CreateSporeWithoutCluster()}} >Create Spore</button>
      </main>
      
    </div>
  );
}
