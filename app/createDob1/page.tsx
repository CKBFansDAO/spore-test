"use client";
import ConnectWallet from "@/components/ConnectWallet";
import {
  Button,
  Input,
  Select,
  Form,
  message,
  Steps,
  theme,
  Typography,
  Card,
  Space,
  notification
} from "antd";
import type { FormProps } from "antd";
import { CloseOutlined } from "@ant-design/icons";
type NotificationType = 'success' | 'info' | 'warning' | 'error';

import {
  dob,
  createSporeCluster,
  findSporeClustersBySigner,
  createSpore,
} from "@ckb-ccc/spore";
import { ccc } from "@ckb-ccc/connector-react";
import { useEffect, useState } from "react";

const steps = [
  {
    title: "Create Cluster",
    content: "First-content",
  },

  {
    title: "Create Spore",
    content: "Second-content",
  },
  {
    title: "Check Spore",
    content: "Last-content",
  },
];
function generateClusterDescriptionUnderDobProtocol(
  client: ccc.Client,
  formValues?: any,
  clusterName?: string
): { dob1Pattern: dob.PatternElementDob1[]; description: string } {
  /**
   * Generation example for DOB0
   */
  console.log(formValues)
  const clusterDescription = clusterName || "test cluster";
  const coverImg = (formValues && formValues.images&&formValues.images[0].url && formValues.images[0]) || {
    url: "btcfs://6930318f91db75ee7279f99c69e75f19582e1bbc31d260140323ab36df3255f8i0",
    width: "100%",
    height: "100%",
    positionX: 0,
    positionY: 0,
  };
  console.log(coverImg)
  const elementsImg = (formValues &&
    formValues.images &&
    formValues.images[1]) || {
    url: "btcfs://82f12bf2d9ed04e7e5098f10898eb6f22c79d2514505711d529bed6a8d26e816i0",
    width: "20",
    height: "20",
    positionX: 5,
    positionY: 20,
  };
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
          `<image width='${coverImg.width}' height='${coverImg.height}'  x='${coverImg.positionX}' y='${coverImg.positionY}' href='${coverImg.url}' />`,
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
          `<image width='${elementsImg.width}' height='${elementsImg.width}'  x='${elementsImg.positionX}' y='${elementsImg.positionY}' href='${elementsImg.url}' />`,
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
  
  console.log("dob1:", dob1);

  return {
    dob1Pattern: dob1Pattern,
    description: dob1ClusterDescription,
  };
}
export default function Home() {
  const signer = ccc.useSigner();
  const [clusterName, SetClusterName] = useState<string>("");
  const [dnaText, SetDnaText] = useState<string>("");
  const [current, setCurrent] = useState(0);
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type: NotificationType,title:string,message:string) => {
    api[type]({
      message: title,
      description:message,
      duration: 0,
    });
  };
  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };
  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  const [selectCluster, SetSelectCluster] = useState('');

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
        description:
          generateClusterDescriptionUnderDobProtocol(client,form.getFieldsValue(),clusterName).description,
      },
    });
    openNotificationWithIcon('info',"clusterId:", id);
    await tx.completeFeeBy(signer);
    tx = await signer.signTransaction(tx);
    const txHash = await signer.sendTransaction(tx);
    openNotificationWithIcon('success',"Transaction sent:", txHash);

    console.log("Transaction sent:", txHash);
    await signer.client.waitTransaction(txHash);
    openNotificationWithIcon('success',"Transaction committed:", txHash);
    setCurrent(1)
    fecthClusters();
  };
  const CreateSpore = async () => {
    if (!signer) return;
    if (!selectCluster) return;
    if (!dnaText) return;
    console.log(selectCluster)
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
        clusterId: selectCluster
      },
      clusterMode: "clusterCell",
    });
    openNotificationWithIcon('info',"sporeId:", id);
    // Complete transaction
    await tx.completeFeeBy(signer);
    tx = await signer.signTransaction(tx);
    const txHash = await signer.sendTransaction(tx);
    openNotificationWithIcon('success',"Transaction sent:", txHash);
    await signer.client.waitTransaction(txHash);
    openNotificationWithIcon('success',"Transaction committed:", txHash);
    setCurrent(2)

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
  const contentStyle: React.CSSProperties = {
    lineHeight: "2",
    textAlign: "center",
    color: token.colorTextTertiary,
    backgroundColor: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    border: `1px dashed ${token.colorBorder}`,
    marginTop: 16,
  };

  return (
    <div className="w-[1000px] m-auto min-h-screen p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
        {contextHolder}
      <Steps current={current} items={items} />
      <div style={contentStyle}>
        {current === 0 && (
          <div style={{ textAlign: "left",padding:'20px' }}>
            <Typography.Title level={5} style={{ margin: 20 }}>
              Cluster Name
            </Typography.Title>
            <Input
              style={{ width: 200, margin: 20 }}
              type="text"
              onChange={(e) => SetClusterName(e.target.value)}
              placeholder="cluster name"
            />
            <Typography.Title level={5} style={{ margin: 20 }}>
              Cluster images
            </Typography.Title>
            <Form
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
              form={form}
              name="dynamic_form_complex"
              style={{ maxWidth: '100%'}}
              autoComplete="off"
              initialValues={{ images: [{}] }}
            >
              <Form.List name={'images'}>
                {(fields,{ add, remove }) => (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      rowGap: 16,
                    }}
                  >
                    {fields.map((field) => (
                      <Space key={field.key}>
                        <Form.Item noStyle name={[field.name, "url"]}  rules={[{ required: true, message: 'Missing url' }]}>
                          <Input placeholder="image url" />
                        </Form.Item>
                        <Form.Item noStyle name={[field.name, "width"]}  rules={[{ required: true, message: 'Missing width' }]}>
                          <Input placeholder="image width" />
                        </Form.Item>
                        <Form.Item noStyle name={[field.name, "height"]}  rules={[{ required: true, message: 'Missing height' }]}>
                          <Input placeholder="image height" />
                        </Form.Item>
                        <Form.Item noStyle name={[field.name, "positionX"]}  rules={[{ required: true, message: 'Missing positionX' }]}>
                          <Input placeholder="positionX" />
                        </Form.Item>
                        <Form.Item noStyle name={[field.name, "positionY"]}  rules={[{ required: true, message: 'Missing positionY' }]}>
                          <Input placeholder="positionY" />
                        </Form.Item>
                        <CloseOutlined
                          onClick={() => {
                            remove(field.name);
                          }}
                        />
                      </Space>
                    ))}
                    {fields.length < 2 && (
                      <Button type="dashed" onClick={() => add()} block>
                        + Add Image
                      </Button>
                    )}
                  </div>
                )}
              </Form.List>

              <Form.Item noStyle shouldUpdate>
                {() => (
                  <Typography style={{ textAlign: "left" }}>
                    <pre>
                      {JSON.stringify(
                        generateClusterDescriptionUnderDobProtocol(
                          client,
                          form.getFieldsValue()
                        ).dob1Pattern,
                        null,
                        2
                      )}
                    </pre>
                  </Typography>
                )}
              </Form.Item>
            </Form>
            <Button
              style={{ width: 200, margin: 20 }}
              onClick={async () => {
                CreateCluster();
              }}
            >
              Create Cluster
            </Button>
          </div>
        )}

        {current === 1 && (
          <div>
            <Select
              style={{ width: 200, margin: 20 }}
              options={clusterList.map((cluster) => ({
                value: cluster.id,
                label: cluster.name,
              }))}
              onChange={(option) =>
                SetSelectCluster(option)
              }
              placeholder="Select an Cluster"
            />
            <Input
              type="text"
              value={dnaText}
              onChange={(e) => SetDnaText(e.target.value)}
              placeholder="spore dna"
            />
            <Button
              style={{ width: 200, margin: 20 }}
              onClick={async () => {
                CreateSpore();
              }}
            >
              Create Spore
            </Button>
          </div>
          
        )}
         {current === 2 && (
          <div>
            go to 
          </div>
          
        )}
      </div>
      <div style={{ marginTop: 24 }}>
        {current < steps.length - 1 && (
          <Button type="primary" onClick={() => next()}>
            Next
          </Button>
        )}
        {current === steps.length - 1 && (
          <Button
            type="primary"
            onClick={() => message.success("Processing complete!")}
          >
            Done
          </Button>
        )}
        {current > 0 && (
          <Button style={{ margin: "0 8px" }} onClick={() => prev()}>
            Previous
          </Button>
        )}
      </div>

      {/* <ConnectWallet></ConnectWallet> */}
    </div>
  );
}
