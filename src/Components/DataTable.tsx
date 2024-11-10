import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  IconButton,
  Input,
  Row,
  SelectPicker,
  Checkbox,
} from "rsuite";
import api from "../../../utility/api";
import { useMutation } from "react-query";
import { useModal } from "../../../context/ModalContext";
import PlusIcon from "@rsuite/icons/Plus";
import MinusIcon from "@rsuite/icons/Minus";
import "./style.scss";
import { Occupationprop } from "./type";
import { Contractprop } from "./type";

type Occupapropobj = {
  [key: string]: Occupationprop[];
};

const DataTable = () => {
  const { openModal } = useModal();

  const [contractList, setContractList] = useState<Contractprop[]>([]);
  const [occupationData, setOccupationData] = useState<Occupapropobj>({});
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [checkedContracts, setCheckedContracts] = useState<string[]>([]);

  const getContractList = useMutation(
    [`contracts/getAllContracts`],
    (data: {}) => api.post(`contracts/getAllContracts`, data),
    {
      onSuccess: (res: any) => {
        setContractList(res?.data?.data);
      },
      onError: (err: any) => {
        setContractList([]);
        openModal({
          type: "error",
          message:
            err?.response?.data?.status == 500
              ? "Something went wrong"
              : err?.response?.data?.message,
          backdrop: "",
          closable: true,
        });
      },
    }
  );

  const handleFieldChange = (
    i: number,
    item: string,
    type: string,
    e: string
  ) => {
    setOccupationData((prev) => ({
      ...prev,
      [item]: prev[item].map((ele, index) =>
        index == i ? { ...ele, [type]: e } : ele
      ),
    }));
  };

  const handleExAdd = (title: string | null) => {
    if (title != null) {
      setOccupationData((prev) => ({
        ...prev,
        [title]: [
          ...prev[title],
          { screen: "", command: "", workflow: "", topicid: "" },
        ],
      }));
    }
  };

  const deleteOccupationRow = (title: string | null, i: number) => {
    title &&
      (() => {
        setOccupationData((prev) => {
          const updatedField = prev[title].filter((_, index) => index !== i);
          const updatedOccupationData = { ...prev };

          updatedField.length == 0
            ? (() => {
                delete updatedOccupationData[title];
                setCheckedContracts((prevChecked) =>
                  prevChecked.filter((item) => item !== title)
                );

                selectedContract === title &&
                  (() => {
                    const lastCheckedContract = checkedContracts.find(
                      (contract) => contract !== title
                    );
                    setSelectedContract(lastCheckedContract || null);
                  })();
              })()
            : (() => {
                updatedOccupationData[title] = updatedField;
              })();

          return updatedOccupationData;
        });
      })();
  };

  function handleReset() {
    const resetData = Object.keys(occupationData).reduce(
      (acc: any, curr: any) => {
        acc[curr] = occupationData[curr].map((ele) => ({
          screen: "",
          command: "",
          workflow: "",
          topicid: "",
        }));

        return acc;
      },
      {}
    );
    setOccupationData(resetData);
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formattedData = Object.keys(occupationData).reduce(
      (acc1: any, curr1: any) => {
        acc1[curr1] = occupationData[curr1].reduce((acc2: any, curr2: any) => {
          if (!acc2[curr2.screen]) {
            acc2[curr2.screen] = {};
          }
          acc2[curr2.screen][curr2.command] = {
            workflow_name: curr2.workflow,
            topicId: curr2.topicid,
          };
          return acc2;
        }, {});
        return acc1;
      },
      {}
    );
    console.log(JSON.stringify(formattedData));
  };

  const handleCheckboxChange = (value: string | null, checked: boolean) => {
    value &&
      (() => {
        setCheckedContracts((prev) =>
          checked ? [...prev, value] : prev.filter((item) => item !== value)
        ),
          checked
            ? (() => {
                setSelectedContract(value);
                handleAddObj(value);
              })()
            : (() => {
                const remainingCheckedContracts = checkedContracts.filter(
                  (ele) => ele != value
                );
                const newLastCheckedContract =
                  remainingCheckedContracts[
                    remainingCheckedContracts.length - 1
                  ] || null;

                setSelectedContract(newLastCheckedContract);

                setOccupationData((prev) => {
                  const updatedData = { ...prev };
                  delete updatedData[value];
                  return updatedData;
                });
              })();
      })();
  };

  const handleAddObj = (title: string | null) => {
    if (title != null) {
      setOccupationData((prev) => ({
        ...prev,
        [title]: [{ screen: "", command: "", workflow: "", topicid: "" }],
      }));
    }
  };

  useEffect(() => {
    getContractList.mutate({});
  }, []);

  return (
    <>
      <SelectPicker
        data={
          contractList?.length > 0
            ? contractList.map((item: Contractprop) => ({
                value: item.contractCode,
                label: `${item.contractName ?? ""} (${item.contractCode})`,
                contractName: item.contractName,
              }))
            : []
        }
        value={selectedContract}
        onChange={(value) => {
          setSelectedContract(value);
          handleCheckboxChange(
            value,
            !checkedContracts.includes(value as string)
          );
        }}
        renderMenuItem={(label, item) => {
          const isChecked = checkedContracts.includes(item.value as string);
          return <Checkbox checked={isChecked}>{label}</Checkbox>;
        }}
        searchable={false}
        style={{ width: 200 }}
        placeholder="Select Contract"
      />

      <form onSubmit={handleSubmit}>
        <div className="inputInner">
          {Object.keys(occupationData).map((item, index) => {
            return (
              <div key={index}>
                <p className="contact_code">
                  {" "}
                  {item}
                  <span style={{ color: "red" }}>*</span>
                </p>
                {occupationData[item].map((ele, i) => {
                  return (
                    <div key={i}>
                      <div>
                        <Row style={{ marginTop: "15px" }}>
                          <Col lg={10} md={10} style={{ marginTop: "15px" }}>
                            <div className="eligibilityRuleBasis_dropdown">
                              <Input
                                style={{ width: "100%" }}
                                type="text"
                                required
                                placeholder="Enter screen name"
                                value={ele.screen}
                                onChange={(e) => {
                                  handleFieldChange(i, item, "screen", e);
                                }}
                              />
                            </div>
                          </Col>
                          <Col lg={10} md={10} style={{ marginTop: "15px" }}>
                            <div className="eligibilityRuleBasis_dropdown">
                              <Input
                                style={{ width: "100%" }}
                                type="text"
                                required
                                placeholder="Enter command"
                                value={ele.command}
                                onChange={(e) => {
                                  handleFieldChange(i, item, "command", e);
                                }}
                              />
                            </div>
                          </Col>
                          <Col lg={10} md={10} style={{ marginTop: "15px" }}>
                            <div className="eligibilityRuleBasis_dropdown">
                              <Input
                                style={{ width: "100%" }}
                                type="text"
                                required
                                placeholder="Enter workflow name"
                                value={ele.workflow}
                                onChange={(e) => {
                                  handleFieldChange(i, item, "workflow", e);
                                }}
                              />
                            </div>
                          </Col>

                          <Col lg={10} md={10} style={{ marginTop: "15px" }}>
                            <div className="eligibilityRuleBasis_dropdown">
                              <Input
                                style={{ width: "100%" }}
                                type="text"
                                required
                                placeholder="Enter topic id"
                                value={ele.topicid}
                                onChange={(e) => {
                                  handleFieldChange(i, item, "topicid", e);
                                }}
                              />
                            </div>
                          </Col>

                          <Col lg={4} md={4} className="addPlusButton">
                            <IconButton
                              style={{ marginRight: 5 }}
                              onClick={() => {
                                handleExAdd(item);
                              }}
                              icon={<PlusIcon />}
                            />

                            <IconButton
                              appearance="primary"
                              onClick={() => {
                                deleteOccupationRow(item, i);
                              }}
                              icon={<MinusIcon />}
                            ></IconButton>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {Object.keys(occupationData).length > 0 && (
          <div className="button_div">
            <Button
              appearance="ghost"
              className="mx-2"
              style={{ width: 150 }}
              onClick={handleReset}
            >
              RESET
            </Button>
            <Button
              type="submit"
              appearance="primary"
              className="mx-2"
              style={{ width: 150 }}
            >
              SUBMIT
            </Button>
          </div>
        )}
      </form>
    </>
  );
};

export default DataTable;
