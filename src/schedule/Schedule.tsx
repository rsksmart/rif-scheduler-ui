import "date-fns";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker,
} from "@material-ui/pickers";
import { useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { CardActions } from "@material-ui/core";
import ColorSelector from "./ColorSelector";
import History from "./History";
import useSchedule, { IScheduleItem } from "./useSchedule";
import { v4 as uuidv4 } from "uuid";
import { ENetwork } from "../shared/types";
import useProviders from "../providers/useProviders";
import useContracts from "../contracts/useContracts";
import Typography from "@material-ui/core/Typography";
import { parseISO } from "date-fns";
import hyphensAndCamelCaseToWords from "../shared/hyphensAndCamelCaseToWords";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      width: "100%",
      maxWidth: 800,
    },
  })
);

const Schedule = () => {
  const classes = useStyles();

  const [fields, setFields] = useState<Partial<IScheduleItem> | null>(null);

  const scheduleAndSave = useSchedule((state) => state.scheduleAndSave);

  const providers = useProviders((state) => state.providers);
  const contracts = useContracts((state) => state.contracts);

  const handleExecuteAtChange = (date: Date | null) => {
    setFields((values) => ({
      ...values,
      executeAt: date ? date.toISOString() : undefined,
    }));
  };

  const handleNetworkChange = (event: any) => {
    setFields((values) => ({
      ...values,
      network: event.target.value,
      providerId: undefined,
      contractId: undefined,
      contractMethod: undefined,
      contractFields: undefined,
    }));
  };

  const handleContractChange = (event: any) => {
    setFields((values) => ({
      ...values,
      contractId: event.target.value,
      contractMethod: undefined,
      contractFields: undefined,
    }));
  };

  const handleMethodChange = (event: any) => {
    setFields((values) => ({
      ...values,
      contractMethod: event.target.value,
      contractFields: undefined,
    }));
  };

  const handleContractFieldsChange = (index: number) => (event: any) => {
    setFields((values) => {
      const newFields = [...(values?.contractFields ?? [])];
      newFields[index] = event.target.value;

      return { ...values, contractFields: newFields };
    });
  };

  const handleFieldChange = (fieldName: string) => (event: any) => {
    setFields((values) => ({ ...values, [fieldName]: event.target.value }));
  };

  const handleClear = () => {
    setFields(null);
  };

  const abi = fields?.contractId
    ? JSON.parse(contracts[fields.contractId].ABI)
    : null;

  const contractMethods = abi
    ? abi.filter((x: any) => x.type === "function")
    : [];

  const contractInputs =
    abi && fields?.contractMethod
      ? abi.find(
          (x: any) => x.type === "function" && x.name === fields.contractMethod
        )?.inputs
      : undefined;

  const handleSchedule = () => {
    // TODO: validate schedule fields
    const isValid =
      fields &&
      fields.title &&
      fields.contractId &&
      fields.contractMethod &&
      fields.network &&
      fields.executeAt &&
      fields.providerId;

    let isContractFieldsValid = true;
    for (let i = 0; i < contractInputs.length; i++) {
      isContractFieldsValid =
        fields?.contractFields && fields.contractFields[i] ? true : false;

      if (!isContractFieldsValid) break;
    }

    if (isValid && isContractFieldsValid) {
      scheduleAndSave({
        ...(fields as IScheduleItem),
        id: fields?.id ?? uuidv4(),
      });

      setFields(null);
    }
  };

  return (
    <Layout>
      <Card className={classes.root} variant="outlined">
        <CardHeader title="Schedule" />
        <CardContent>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <div style={{ display: "flex", flex: 1, gap: "4px" }}>
              <TextField
                margin="dense"
                label="Title"
                variant="filled"
                fullWidth
                onChange={handleFieldChange("title")}
                value={fields?.title ? fields.title : ""}
              />
              <ColorSelector
                value={fields?.color ? fields.color : ""}
                onChange={handleFieldChange("color")}
              />
            </div>
            <div style={{ display: "flex", flex: 1, gap: "4px" }}>
              <KeyboardDatePicker
                margin="dense"
                id="executeDate"
                inputVariant="filled"
                label="Date"
                format="MM/dd/yyyy"
                fullWidth={true}
                value={fields?.executeAt ? parseISO(fields.executeAt) : null}
                onChange={handleExecuteAtChange}
                KeyboardButtonProps={{
                  "aria-label": "change date",
                }}
              />
              <KeyboardTimePicker
                margin="dense"
                id="executeTime"
                fullWidth={true}
                label="Time"
                inputVariant="filled"
                value={fields?.executeAt ? parseISO(fields.executeAt) : null}
                onChange={handleExecuteAtChange}
                KeyboardButtonProps={{
                  "aria-label": "change time",
                }}
              />
            </div>
            <div style={{ display: "flex", flex: 1, gap: "4px" }}>
              <FormControl variant="filled" fullWidth margin="dense">
                <InputLabel id="schedule-network">Network</InputLabel>
                <Select
                  labelId="schedule-network"
                  onChange={handleNetworkChange}
                  value={fields?.network ? fields.network : ""}
                >
                  <MenuItem disabled>None</MenuItem>
                  <MenuItem value={ENetwork.Mainnet}>Mainnet</MenuItem>
                  <MenuItem value={ENetwork.Testnet}>Testnet</MenuItem>
                </Select>
              </FormControl>
              <FormControl variant="filled" fullWidth margin="dense">
                <InputLabel id="schedule-provider">Provider</InputLabel>
                <Select
                  labelId="schedule-provider"
                  value={fields?.providerId ? fields.providerId : ""}
                  onChange={handleFieldChange("providerId")}
                >
                  <MenuItem disabled>None</MenuItem>
                  {Object.entries(providers)
                    .filter(
                      ([id, provider]) => provider.network === fields?.network
                    )
                    .map(([id, provider]) => (
                      <MenuItem key={`schedule-provider-${id}`} value={id}>
                        {provider.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </div>
            <div style={{ display: "flex", flex: 1, gap: "4px" }}>
              <FormControl variant="filled" fullWidth margin="dense">
                <InputLabel id="schedule-contract">Contract</InputLabel>
                <Select
                  labelId="schedule-contract"
                  value={fields?.contractId ? fields.contractId : ""}
                  onChange={handleContractChange}
                >
                  <MenuItem disabled>None</MenuItem>
                  {Object.entries(contracts)
                    .filter(
                      ([id, contract]) => contract.network === fields?.network
                    )
                    .map(([id, contract]) => (
                      <MenuItem key={`schedule-contract-${id}`} value={id}>
                        {contract.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <FormControl variant="filled" fullWidth margin="dense">
                <InputLabel id="schedule-contract-method">Method</InputLabel>
                <Select
                  labelId="schedule-contract-method"
                  value={fields?.contractMethod ? fields.contractMethod : ""}
                  onChange={handleMethodChange}
                >
                  <MenuItem disabled>None</MenuItem>
                  {contractMethods.map((method: any) => (
                    <MenuItem
                      key={`contract-method-${method.name}`}
                      value={method.name}
                    >
                      {hyphensAndCamelCaseToWords(method.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div
              style={{
                display: "flex",
                flex: 1,
                gap: "4px",
                flexDirection: "column",
              }}
            >
              {contractInputs && contractInputs.length > 0 && (
                <Typography
                  variant="caption"
                  display="block"
                  color="textSecondary"
                  style={{ marginTop: 12 }}
                >
                  Method parameters
                </Typography>
              )}
              {contractInputs &&
                contractInputs.map(({ name, type }: any, index: number) => (
                  <TextField
                    margin="dense"
                    label={`${hyphensAndCamelCaseToWords(name)} (${
                      type.includes("int") ? "number" : type
                    })`}
                    variant="filled"
                    fullWidth
                    onChange={handleContractFieldsChange(index)}
                    value={
                      fields?.contractFields
                        ? fields?.contractFields[index]
                        : ""
                    }
                  />
                ))}
            </div>
          </MuiPickersUtilsProvider>
        </CardContent>
        <CardActions style={{ justifyContent: "flex-end" }}>
          <Button onClick={handleClear} color="inherit">
            Clear
          </Button>
          <Button onClick={handleSchedule} color="primary">
            Schedule
          </Button>
        </CardActions>
      </Card>
      <div className={classes.root} style={{ marginTop: 15 }}>
        <History />
      </div>
    </Layout>
  );
};

export default Schedule;
