"use client"

// import ConnectWallet from "@/components/ConnectWallet";
import { createSpore} from "@ckb-ccc/spore";
import { ccc } from "@ckb-ccc/connector-react";
import { useState } from "react";
import { Button, Input,notification } from "antd";
type NotificationType = "success" | "info" | "warning" | "error";

export default function Home() {
  const signer = ccc.useSigner();
  const [dnaText, SetDnaText] = useState<string>("");
  const [api, contextHolder] = notification.useNotification();

  const openNotificationWithIcon = (
    type: NotificationType,
    title: string,
    message: string
  ) => {
    api[type]({
      message: title,
      description: message,
      duration: 0,
    });
  };
  const CreateSporeWithoutCluster = async () => {
    
    if (!signer) return;
    if(!dnaText) return;
    // Build transaction
    const { tx, id } = await createSpore({
      signer,
      data: {
        contentType: "text/plain",
        content: ccc.bytesFrom(dnaText, "utf8"),
      },
    });
    openNotificationWithIcon('info','sporeId:', id);

    // Complete transaction
    await tx.completeFeeBy(signer); // 0.001 CKB in shannons
    // Send transaction
    const txHash = await signer.sendTransaction(tx);
    openNotificationWithIcon('info',"Transaction sent:", txHash);
    await signer.client.waitTransaction(txHash);
    openNotificationWithIcon('success',"Transaction committed:",txHash);
  };
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {contextHolder}
      {/* <ConnectWallet></ConnectWallet> */}
      
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Input  type="text" placeholder="DOB text"  value={dnaText} onChange={(e) => SetDnaText(e.target.value)} />
        <Button  onClick={async () => {CreateSporeWithoutCluster()}} >Create Spore</Button>
      </main>
      
    </div>
  );
}
