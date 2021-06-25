import "date-fns";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import DateFnsUtils from "@date-io/date-fns";
import Hidden from "@material-ui/core/Hidden";
import {
  MuiPickersUtilsProvider,
  KeyboardDateTimePicker,
} from "@material-ui/pickers";
import { useEffect, useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import CardActions from "@material-ui/core/CardActions";
import ColorSelector from "./ColorSelector";
import History from "./History";
import useSchedule, { IScheduleItem } from "./useSchedule";
import useProviders from "../providers/useProviders";
import useContracts from "../contracts/useContracts";
import Typography from "@material-ui/core/Typography";
import { parseISO, isValid } from "date-fns";
import hyphensAndCamelCaseToWords from "../shared/hyphensAndCamelCaseToWords";
import shallow from "zustand/shallow";
import ButtonWithLoading from "../shared/ButtonWIthLoading";
import { fromBigNumberToHms } from "../shared/formatters";
import useConnector from "../connect/useConnector";
import { useSnackbar } from "notistack";
import useRifScheduler from "../providers/useRifScheduler";
import NetworkLabel from "../connect/NetworkLabel"

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

  const [fields, setFields] = useState<Partial<IScheduleItem> | null>();

  const [scheduleAndSave, isLoading] = useSchedule(
    (state) => [state.scheduleAndSave, state.isLoading],
    shallow
  );

  const providers = useProviders((state) => state.providers);
  const contracts = useContracts((state) => state.contracts);
  const [account, connectedToNetwork] = useConnector(state => [state.account, state.network], shallow);
  const rifScheduler = useRifScheduler();

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!isLoading) {
      handleClear();
    }
  }, [isLoading]);

  const handleExecuteAtChange = (date: Date | null) => {
    setFields((values) => ({
      ...values,
      executeAt: date && isValid(date) ? date.toISOString() : undefined,
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
    setFields((prev) => ({}));
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

  const providerPlans =
    Object.values(providers).find(
      (provider) => provider.id === fields?.providerId
    )?.plans ?? [];

  const handleSchedule = () => {
    // TODO: validate schedule fields
    const isValid =
      fields &&
      fields.title &&
      fields.contractId &&
      fields.contractMethod &&
      fields.executeAt &&
      fields.providerId &&
      fields.providerPlanIndex;

    let isContractFieldsValid = true;
    for (let i = 0; contractInputs && i < contractInputs.length; i++) {
      isContractFieldsValid =
        fields?.contractFields && fields.contractFields[i] ? true : false;

      if (!isContractFieldsValid) break;
    }

    if (isValid && isContractFieldsValid && rifScheduler) {
      scheduleAndSave(
        {...fields, network: connectedToNetwork!} as IScheduleItem,
        contracts[fields!.contractId!],
        rifScheduler,
        account!,
        () =>
          enqueueSnackbar("Execution schedule confirmed!", {
            variant: "success",
          }),
        (message) =>
          enqueueSnackbar(message, {
            variant: "error",
          })
      );
    }
  };

  return (
    <Layout>
      <Card className={classes.root} variant="outlined">
        <CardHeader
          title={<Hidden xsDown>Schedule</Hidden>}
          action={
            <NetworkLabel />
          }
        />
        <CardContent style={{ paddingTop: 0, paddingBottom: 0 }}>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <div
              style={{
                display: "flex",
                flex: 1,
                gap: "4px",
                justifyContent: "space-around",
                flexWrap: "wrap",
              }}
            >
              <TextField
                disabled={isLoading}
                margin="dense"
                label="Title"
                variant="filled"
                fullWidth
                style={{ flex: 1, minWidth: 200 }}
                onChange={handleFieldChange("title")}
                value={fields?.title ? fields.title : ""}
              />
              <KeyboardDateTimePicker
                disabled={isLoading}
                margin="dense"
                id="executeAt"
                inputVariant="filled"
                label="Execute At"
                format="MM/dd/yyyy HH:mm"
                fullWidth={true}
                style={{ flex: 1, minWidth: 200 }}
                value={fields?.executeAt ? parseISO(fields.executeAt) : null}
                onChange={handleExecuteAtChange}
                KeyboardButtonProps={{
                  "aria-label": "change execute at",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flex: 1,
                gap: "4px",
                justifyContent: "space-around",
                flexWrap: "wrap",
              }}
            >
              <FormControl
                variant="filled"
                fullWidth
                style={{ flex: 1, minWidth: 200 }}
                margin="dense"
                disabled={isLoading}
              >
                <InputLabel id="schedule-provider">Provider</InputLabel>
                <Select
                  labelId="schedule-provider"
                  value={fields?.providerId ? fields.providerId : ""}
                  onChange={handleFieldChange("providerId")}
                >
                  <MenuItem disabled>None</MenuItem>
                  {Object.entries(providers)
                    .filter(
                      ([id, provider]) => provider.network === connectedToNetwork
                    )
                    .map(([id, provider]) => (
                      <MenuItem key={`schedule-provider-${id}`} value={id}>
                        {provider.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <FormControl
                variant="filled"
                fullWidth
                style={{ flex: 1, minWidth: 200 }}
                margin="dense"
                disabled={isLoading}
              >
                <InputLabel id="schedule-provider-plan">Plan</InputLabel>
                <Select
                  labelId="schedule-provider-plan"
                  value={`${
                    fields?.providerPlanIndex ? fields.providerPlanIndex : ""
                  }`}
                  onChange={handleFieldChange("providerPlanIndex")}
                >
                  <MenuItem disabled>None</MenuItem>
                  {providerPlans.map((plan, index) => (
                    <MenuItem
                      key={`schedule-provider-plan-${fields?.providerId}-${index}`}
                      value={`${index}`}
                    >
                      {`#${index + 1}`}
                      <span
                        style={{ marginLeft: 8 }}
                      >{`Window: ${fromBigNumberToHms(plan.window)}`}</span>
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
                justifyContent: "space-around",
                flexWrap: "wrap",
              }}
            >
              <FormControl
                variant="filled"
                fullWidth
                style={{ flex: 1, minWidth: 200 }}
                margin="dense"
                disabled={isLoading}
              >
                <InputLabel id="schedule-contract">Contract</InputLabel>
                <Select
                  labelId="schedule-contract"
                  value={fields?.contractId ? fields.contractId : ""}
                  onChange={handleContractChange}
                >
                  <MenuItem disabled>None</MenuItem>
                  {Object.entries(contracts)
                    .filter(
                      ([id, contract]) => contract.network === connectedToNetwork
                    )
                    .map(([id, contract]) => (
                      <MenuItem key={`schedule-contract-${id}`} value={id}>
                        {contract.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <FormControl
                variant="filled"
                fullWidth
                style={{ flex: 1, minWidth: 200 }}
                margin="dense"
                disabled={isLoading}
              >
                <InputLabel id="schedule-contract-method">Action</InputLabel>
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
                  Action Parameters
                </Typography>
              )}
              {contractInputs &&
                contractInputs.map(({ name, type }: any, index: number) => (
                  <TextField
                    disabled={isLoading}
                    margin="dense"
                    label={hyphensAndCamelCaseToWords(name)}
                    helperText={
                      type.includes("int")
                        ? "Number"
                        : hyphensAndCamelCaseToWords(type)
                    }
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
        <CardActions
          style={{ justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <ColorSelector
            disabled={isLoading}
            value={fields?.color ? fields.color : ""}
            onChange={handleFieldChange("color")}
          />
          <div
            style={{
              display: "flex",
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Button
                onClick={handleClear}
                color="inherit"
                disabled={isLoading}
              >
                Clear
              </Button>
            </div>
            <ButtonWithLoading
              onClick={handleSchedule}
              label="Schedule"
              isLoading={isLoading}
            />
          </div>
        </CardActions>
      </Card>

      <div
        className={classes.root}
        style={{
          marginTop: 15,
        }}
      >
        <History />
      </div>
    </Layout>
  );
};

export default Schedule;
