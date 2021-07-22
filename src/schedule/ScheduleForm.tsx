import "date-fns";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardDateTimePicker,
} from "@material-ui/pickers";
import { useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import CardActions from "@material-ui/core/CardActions";
import ColorSelector from "./ColorSelector";
import useSchedule, { IScheduleItem } from "./useSchedule";
import useProviders from "../store/useProviders";
import useContracts from "../contracts/useContracts";
import Typography from "@material-ui/core/Typography";
import { parseISO, isValid } from "date-fns";
import hyphensAndCamelCaseToWords from "../shared/hyphensAndCamelCaseToWords";
import shallow from "zustand/shallow";
import ButtonWithLoading from "../shared/ButtonWIthLoading";
import { formatBigNumber, fromBigNumberToHms } from "../shared/formatters";
import useConnector from "../connect/useConnector";
import { useSnackbar } from "notistack";
import NetworkLabel from "../connect/NetworkLabel";
import {
  Divider,
  IconButton,
  InputAdornment,
  withStyles,
} from "@material-ui/core";
import ScheduleFormDialog, {
  IScheduleFormDialogAlert,
} from "./ScheduleFormDialog";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import cronstrue from "cronstrue";
import Tooltip from "@material-ui/core/Tooltip";
import NumberInput from "../shared/NumberInput";
import PlusIcon from "@material-ui/icons/AddCircleRounded";
import MinusIcon from "@material-ui/icons/RemoveCircleRounded";
import CronButton, { CRON_DEFAULT } from "./CronButton";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      width: "100%",
      maxWidth: 800,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    divider: {
      width: "100%",
      maxWidth: 800,
    },
  })
);

const DEFAULT_FIELDS: Partial<IScheduleItem> = {
  cronExpression: CRON_DEFAULT,
  cronQuantity: "0",
};

const ScheduleForm = () => {
  const classes = useStyles();

  const [fields, setFields] = useState<Partial<IScheduleItem> | null>(
    DEFAULT_FIELDS
  );
  const [alerts, setAlerts] = useState<
    IScheduleFormDialogAlert[] | undefined
  >();

  const [cronError, setCronError] = useState<string | null>(null);
  const [cronText, setCronText] = useState<string>(
    cronstrue.toString(CRON_DEFAULT, { verbose: true })
  );
  const [cronFieldFocused, setCronFieldFocused] = useState<boolean>(false);

  const [scheduleAndSave, validateSchedule, isLoading] = useSchedule(
    (state) => [state.scheduleAndSave, state.validateSchedule, state.isLoading],
    shallow
  );

  const providers = useProviders((state) => state.providers);
  const contracts = useContracts((state) => state.contracts);
  const [account, connectedToNetwork] = useConnector(
    (state) => [state.account, state.network],
    shallow
  );

  const { enqueueSnackbar } = useSnackbar();

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

  const handleCronExpressionChange = (event: any) => {
    const expression = event.target.value;

    setCronError(null);

    setFields((values) => ({ ...values, cronExpression: expression }));
    try {
      const text = cronstrue.toString(expression, { verbose: true });

      setCronText(text);
    } catch (error) {
      let message = "";
      if (typeof error === "string") message = error;
      else message = error.message;

      if (message.includes("Error: ")) message = message.replace("Error: ", "");

      setCronText("");
      setCronError(message);
    }
  };

  const handleCronQuantityIncrement = (increment: number) => (event: any) => {
    let quantity =
      (fields?.cronQuantity ? +fields?.cronQuantity : 0) + increment;

    if (quantity <= 0) quantity = 0;

    setFields((values) => ({ ...values, cronQuantity: quantity.toString() }));
  };

  const handleIsRecurrentFieldChange = (event: any, checked: boolean) => {
    setFields((values) => ({
      ...values,
      isRecurrent: checked,
    }));
  };

  const handleClear = () => {
    setFields((prev) => ({ ...DEFAULT_FIELDS }));
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

  const validateForm = () => {
    const isValid =
      fields &&
      fields.title &&
      fields.contractId &&
      fields.contractMethod &&
      fields.executeAt &&
      fields.providerId &&
      fields.providerPlanIndex;

    const isValidRecurrence =
      fields &&
      (fields.isRecurrent
        ? !cronError &&
          fields.cronExpression &&
          +(fields.cronQuantity ?? "0") > 0
        : true);

    let isContractFieldsValid = true;
    for (let i = 0; contractInputs && i < contractInputs.length; i++) {
      isContractFieldsValid =
        fields?.contractFields && fields.contractFields[i] ? true : false;

      if (!isContractFieldsValid) break;
    }

    return isValid && isValidRecurrence && isContractFieldsValid;
  };

  const handleSchedule = async () => {
    const provider = providers[fields?.providerId ?? ""];

    const isFormValid = validateForm();

    if (provider && isFormValid) {
      const scheduleItem = {
        ...fields,
        network: connectedToNetwork!,
      } as IScheduleItem;
      const selectedContract = contracts[fields!.contractId!];

      const alerts = await validateSchedule(
        scheduleItem,
        selectedContract,
        provider,
        account!
      );

      setAlerts(alerts);

      if (alerts.length === 0) {
        handleScheduleAndSave();
      }
    }
  };

  const handleScheduleAnyway = () => {
    const provider = providers[fields?.providerId ?? ""];

    const isFormValid = validateForm();

    if (provider && isFormValid) {
      handleScheduleAndSave();
      setAlerts([]);
    }
  };

  const handleScheduleAndSave = () => {
    const provider = providers[fields?.providerId ?? ""];

    const scheduleItem = {
      ...fields,
      network: connectedToNetwork!,
    } as IScheduleItem;
    const selectedContract = contracts[fields!.contractId!];

    scheduleAndSave(
      scheduleItem,
      selectedContract,
      provider,
      account!,
      () =>
        enqueueSnackbar("Schedule confirmed!", {
          variant: "success",
        }),
      (message) =>
        enqueueSnackbar(message, {
          variant: "error",
        })
    )
      .then(() => {
        handleClear();
      })
      .catch(() => {
        enqueueSnackbar("Something went wrong, please try again.", {
          variant: "warning",
        });
      });
  };

  return (
    <>
      <ScheduleFormDialog
        alerts={alerts}
        onClose={() => setAlerts([])}
        onConfirm={handleScheduleAnyway}
      />
      <Card className={classes.root}>
        <CardHeader title={"Schedule"} action={<NetworkLabel />} />
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
              <FormControlLabel
                style={{
                  marginTop: 8,
                  marginBottom: 4,
                }}
                control={
                  <Switch
                    checked={fields?.isRecurrent ? true : false}
                    onChange={handleIsRecurrentFieldChange}
                    color="primary"
                  />
                }
                label="Recurrent"
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
              <KeyboardDateTimePicker
                disabled={isLoading}
                margin="dense"
                id="executeAt"
                inputVariant="filled"
                label={fields?.isRecurrent ? "Starts At" : "Execute At"}
                format="MM/dd/yyyy HH:mm"
                fullWidth={true}
                style={{ flex: 1, minWidth: 200 }}
                value={fields?.executeAt ? parseISO(fields.executeAt) : null}
                onChange={handleExecuteAtChange}
                KeyboardButtonProps={{
                  "aria-label": "change execute at",
                }}
              />
              <CustomTooltip
                open={cronFieldFocused}
                title={cronError ? cronError : cronText}
              >
                <TextField
                  disabled={isLoading || !fields?.isRecurrent}
                  margin="dense"
                  label="Recurrence expression"
                  variant="filled"
                  fullWidth
                  style={{ flex: 1, minWidth: 200 }}
                  onChange={handleCronExpressionChange}
                  error={cronError && fields?.isRecurrent ? true : false}
                  onFocus={() => setCronFieldFocused(true)}
                  onBlur={() => setCronFieldFocused(false)}
                  value={
                    fields?.cronExpression !== undefined
                      ? fields.cronExpression
                      : CRON_DEFAULT
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment
                        position="end"
                        style={{ paddingRight: 12 }}
                      >
                        <CronButton
                          onChange={handleCronExpressionChange}
                          value={
                            fields?.cronExpression !== undefined
                              ? fields.cronExpression
                              : CRON_DEFAULT
                          }
                          disabled={isLoading || !fields?.isRecurrent}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </CustomTooltip>
              <TextField
                disabled={isLoading || !fields?.isRecurrent}
                margin="dense"
                label="Executions quantity"
                variant="filled"
                fullWidth
                style={{ flex: 1, minWidth: 200 }}
                onChange={handleFieldChange("cronQuantity")}
                value={fields?.cronQuantity ? fields.cronQuantity : "0"}
                InputProps={{
                  inputComponent: NumberInput as any,
                  startAdornment: (
                    <InputAdornment position="start" style={{ paddingLeft: 0 }}>
                      <IconButton
                        size="small"
                        aria-label="sub 10 quantity"
                        onClick={handleCronQuantityIncrement(-10)}
                        edge="start"
                        disabled={isLoading || !fields?.isRecurrent}
                      >
                        <MinusIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      style={{ paddingRight: 12, marginTop: 16 }}
                    >
                      <IconButton
                        size="small"
                        aria-label="add 10 quantity"
                        onClick={handleCronQuantityIncrement(10)}
                        edge="end"
                        disabled={isLoading || !fields?.isRecurrent}
                      >
                        <PlusIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
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
                      ([id, provider]) =>
                        provider.network === connectedToNetwork
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
                  {providerPlans.map((plan) => (
                    <MenuItem
                      key={`schedule-provider-plan-${fields?.providerId}-${plan.index}`}
                      value={`${plan.index}`}
                    >
                      <span style={{ fontWeight: "bold" }}>{`#${
                        plan.index + 1
                      }`}</span>
                      <span
                        style={{ marginLeft: 8 }}
                      >{`Window: ${fromBigNumberToHms(
                        plan.window
                      )} - Gas limit: ${formatBigNumber(
                        plan.gasLimit,
                        0
                      )}`}</span>
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
                      ([id, contract]) =>
                        contract.network === connectedToNetwork
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
                    key={`field-${name}-${type}`}
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
      <Divider className={classes.divider} />
    </>
  );
};

export default ScheduleForm;

const CustomTooltip = withStyles((theme: Theme) => ({
  tooltip: {
    backgroundColor: "#333",
    color: "rgba(255, 255, 255, 0.87)",
    //boxShadow: theme.shadows[1],
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 2,
    padding: 5,
  },
}))(Tooltip);
