"use client";
import {
  Button,
  Input,
  Select,
  Form,

  Typography,
  Card,
  Space,
} from "antd";
import type { FormProps } from "antd";
import { CloseOutlined } from "@ant-design/icons";

import { useEffect, useState } from "react";

export default function CreateDob0() {
  const [form] = Form.useForm();


  return (
    <div>
      <Typography.Title level={5} style={{ margin: 20 }}>
        Cluster dob0Pattern
      </Typography.Title>

      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        form={form}
        name="dynamic_form_complex"
        style={{ maxWidth: 900 }}
        autoComplete="off"
        initialValues={{
         
          dob1Pattern: [
            {
              imageName: "IMAGE.0",
              svgFields: "attributes",
              traitName: "",
              patternType: "raw",
              traitArgs:
                'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"',
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
          ],
        }}
      >
        <Form.List name="dob0Pattern">
          {(fields, { add, remove }) => (
            <div
              style={{
                display: "flex",
                rowGap: 16,
                flexDirection: "column",
              }}
            >
              {fields.map((field1) => (
                <Card
                  size="small"
                  title={`dob0Pattern ${field1.name + 1}`}
                  key={field1.key}
                >
                  <Form.Item
                    label="traitName"
                    name={[field1.name, "traitName"]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item label="dobType" name={[field1.name, "dobType"]}>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    label="patternType"
                    name={[field1.name, "patternType"]}
                  >
                    <Select
                      options={[
                        {
                          value: "rawNumber",
                          label: "rawNumber",
                        },
                        {
                          value: "options",
                          label: "options",
                        },
                        {
                          value: "range",
                          label: "range",
                        },
                        {
                          value: "utf8",
                          label: "utf8",
                        },
                      ]}
                    />
                  </Form.Item>
                  {form.getFieldValue([
                    "dob0Pattern",
                    field1.name,
                    "patternType",
                  ]) === "options" && (
                    <Form.Item label="TraitArgs">
                      <Form.List name={[field1.name, "traitArgs"]}>
                        {(subFields, subOpt) => (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              rowGap: 16,
                            }}
                          >
                            {subFields.map((subField) => (
                              <Space key={subField.key}>
                                <Form.Item noStyle>
                                  <Input placeholder="" />
                                </Form.Item>

                                <CloseOutlined
                                  onClick={() => {
                                    subOpt.remove(subField.name);
                                  }}
                                />
                              </Space>
                            ))}
                            <Button
                              type="dashed"
                              onClick={() => subOpt.add()}
                              block
                            >
                              + Add traitArgs
                            </Button>
                          </div>
                        )}
                      </Form.List>
                    </Form.Item>
                  )}
                </Card>
              ))}

              {/* <Button type="dashed" onClick={() => add()} block>
                      + Add Item
                    </Button> */}
            </div>
          )}
        </Form.List>
      </Form>
    </div>
  );
}
