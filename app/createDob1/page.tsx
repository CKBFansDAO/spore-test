"use client";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";
import ConnectWallet from "@/components/ConnectWallet";
import {
  dob,
  createSporeCluster,
  findSporeClustersBySigner,
  createSpore,
} from "@ckb-ccc/spore";
import { ccc } from "@ckb-ccc/connector-react";
import { useEffect, useState } from "react";
function generateClusterDescriptionUnderDobProtocol(
  client: ccc.Client
): string {
  /**
   * Generation example for DOB0
   */
  const clusterDescription = "My Test Cluster";

  const dob0Pattern: dob.PatternElementDob0[] = [
    {
      traitName: "Cover",
      dobType: "Number",
      dnaOffset: 0,
      dnaLength: 6,
      patternType: "rawNumber",
    },
    {
      traitName: "Level",
      dobType: "String",
      dnaOffset: 6,
      dnaLength: 1,
      patternType: "options",
      traitArgs: ["GOLD", "SILVER", "COPPER", "BLUE"],
    },
  ];
  const dob1Pattern: dob.PatternElementDob1[] = [
    {
      imageName: "IMAGE.0",
      svgFields: "attributes",
      traitName: "",
      patternType: "raw",
      traitArgs: 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"',
    },
    {
      imageName: "IMAGE.0",
      svgFields: "elements",
      traitName: "Cover",
      patternType: "options",
      traitArgs: [
        [
          ["*"],
          `<image width='100%' height='100%' href='btcfs://6930318f91db75ee7279f99c69e75f19582e1bbc31d260140323ab36df3255f8i0' />`,
        ],
      ],
    },

    {
      imageName: "IMAGE.0",
      svgFields: "elements",
      traitName: "Level",
      patternType: "options",
      traitArgs: [
        [
          ["*"],
          "<image width='20' height='20'  x='5' y='20' href='btcfs://82f12bf2d9ed04e7e5098f10898eb6f22c79d2514505711d529bed6a8d26e816i0' />",
        ],
      ],
    },
  ];

  const dob1: dob.Dob1 = {
    description: clusterDescription,
    dob: {
      ver: 1,
      decoders: [
        {
          decoder: dob.getDecoder(client, "dob0"),
          pattern: dob0Pattern,
        },
        {
          decoder: dob.getDecoder(client, "dob1"),
          pattern: dob1Pattern,
        },
      ],
    },
  };
  const dob1ClusterDescription = dob.encodeClusterDescriptionForDob1(dob1);
  console.log("dob1 =", dob1ClusterDescription);

  return dob1ClusterDescription;
}
export default function Home() {
  const signer = ccc.useSigner();
  const [clusterName, SetClusterName] = useState<string>("");
  const [dnaText, SetDnaText] = useState<string>("");
  const [selectCluster, SetSelectCluster] = useState<
    { value: string; label: string } | undefined
  >(undefined);

  const client = new ccc.ClientPublicTestnet();
  const [clusterList, setClusterList] = useState([
    {
      id: "",
      name: "no Cluster",
    },
  ]);
  const CreateCluster = async () => {
    if (!signer) return;
    let { tx, id } = await createSporeCluster({
      signer,

      data: {
        name: clusterName,
        description: generateClusterDescriptionUnderDobProtocol(client),
      },
    });
    console.log("clusterId:", id);
    await tx.completeFeeBy(signer);
    tx = await signer.signTransaction(tx);
    const txHash = await signer.sendTransaction(tx);
    console.log("Transaction sent:", txHash);
    await signer.client.waitTransaction(txHash);
    console.log("Transaction committed:", txHash);
    fecthClusters();
  };
  const CreateSpore = async () => {
    if (!signer) return;
    if (!selectCluster) return;
    if (!dnaText) return;
    const hasher = new ccc.HasherCkb(7);
    hasher.update(ccc.bytesFrom(dnaText, "utf8"));
    let dna = ccc.bytesFrom(hasher.digest());
    dna = ccc.bytesConcat(dna, ccc.bytesFrom(dnaText, "utf8"));
    // expect(dna.length === 20);
    const hexedDna = ccc.bytesTo(dna, "hex"); // no leading "0x"
    const content = `{"dna":"${hexedDna}"}`;
    // Build transaction
    let { tx, id } = await createSpore({
      signer,
      data: {
        contentType: "dob/1",
        content: ccc.bytesFrom(content, "utf8"),
        clusterId: selectCluster?.value,
      },
      clusterMode: "clusterCell",
    });
    console.log("sporeId:", id);
    // Complete transaction
    await tx.completeFeeBy(signer);
    tx = await signer.signTransaction(tx);
    const txHash = await signer.sendTransaction(tx);
    console.log("Transaction sent:", txHash);
    await signer.client.waitTransaction(txHash);
    console.log("Transaction committed:", txHash);
  };
  const fecthClusters = async () => {
    let list = [];
    if (!signer) {
      return;
    }
    for await (const cluster of findSporeClustersBySigner({
      signer,
      order: "desc",
    })) {
      list.push({
        id: cluster.cluster.cellOutput.type?.args || "",
        name: cluster.clusterData.name,
      });
    }
    setClusterList((prevState) => [...prevState, ...list]);
  };
  useEffect(() => {
    let synced = false;
    fecthClusters();
    return () => {
      synced = true;
    };
  }, [signer]);
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <ConnectWallet></ConnectWallet>
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <input
          type="text"
          onChange={(e) => SetClusterName(e.target.value)}
          placeholder="cluster name"
        />
        <button
          className="cursor-pointer rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          onClick={async () => {
            CreateCluster();
          }}
        >
          Create Cluster
        </button>
        <Dropdown
          options={clusterList.map((cluster) => ({
            value: cluster.id,
            label: cluster.name,
          }))}
          onChange={(option) =>
            SetSelectCluster(option as { value: string; label: string })
          }
          value={{ value: clusterList[0].id, label: clusterList[0].name }}
          placeholder="Select an Cluster"
        />
        <input
          type="text"
          value={dnaText}
          onChange={(e) => SetDnaText(e.target.value)}
          placeholder="spore dna"
        />
        <button
          className="cursor-pointer rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          onClick={async () => {
            CreateSpore();
          }}
        >
          Create Spore
        </button>
      </main>
    </div>
  );
}
