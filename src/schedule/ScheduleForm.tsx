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
import { useEffect, useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import CardActions from "@material-ui/core/CardActions";
import ColorSelector from "./ColorSelector";
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
import Tooltip from "@material-ui/core/Tooltip";
import NumberInput from "../shared/NumberInput";
import PlusIcon from "@material-ui/icons/AddCircleRounded";
import MinusIcon from "@material-ui/icons/RemoveCircleRounded";
import CronButton from "./CronButton";
import {
  DEFAULT_CRON_FIELD,
  ICronField,
} from "./cronParser/convertToCronExpression";
import {
  IProviderSnapshot,
  useProvidersStore,
} from "../sdk-hooks/useProviders";
import { validateBeforeSchedule } from "./validateBeforeSchedule";
import { usePlans } from "../sdk-hooks/usePlans";
import { useExecutions } from "../sdk-hooks/useExecutions";
import { getMessageFromCode } from "eth-rpc-errors";

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

const DEFAULT_FIELDS: Partial<IFormFields> = {
  cronFields: DEFAULT_CRON_FIELD,
  cronQuantity: "0",
};

export interface IFormFields {
  title: string;
  executeAt: string;
  providerAddress: string;
  providerPlanIndex: string;
  contractId: string;
  contractAction: string;
  contractFields: string[];
  color?: string;
  isRecurrent?: boolean;
  cronFields?: ICronField;
  cronQuantity?: string;
}

const ScheduleForm = () => {
  const classes = useStyles();

  const [, , schedule] = useExecutions();

  const [fields, setFields] = useState<Partial<IFormFields> | null>(
    DEFAULT_FIELDS
  );
  const [alerts, setAlerts] = useState<
    IScheduleFormDialogAlert[] | undefined
  >();

  const [cronFieldFocused, setCronFieldFocused] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const providers = useProvidersStore((state) => state.providers);

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
      contractAction: undefined,
      contractFields: undefined,
    }));
  };

  const handleMethodChange = (event: any) => {
    setFields((values) => ({
      ...values,
      contractAction: event.target.value,
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

  const handleCronFieldsChange = (event: any) => {
    const cronFields = event.target.value;

    setFields((values) => ({ ...values, cronFields }));
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

  const contractActions = abi
    ? abi.filter((x: any) => x.type === "function")
    : [];

  const contractInputs =
    abi && fields?.contractAction
      ? abi.find(
          (x: any) => x.type === "function" && x.name === fields.contractAction
        )?.inputs
      : undefined;

  const selectedProvider = providers.find(
    (provider) => provider.config.contractAddress === fields?.providerAddress
  );

  const validateForm = () => {
    const isValid =
      fields &&
      fields.title &&
      fields.contractId &&
      fields.contractAction &&
      fields.executeAt &&
      fields.providerAddress &&
      fields.providerPlanIndex;

    const isValidRecurrence =
      fields &&
      (fields.isRecurrent
        ? fields.cronFields && +(fields.cronQuantity ?? "0") > 0
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
    const provider = providers.find(
      (x) => x.config.contractAddress === fields?.providerAddress
    );

    const isFormValid = validateForm();

    if (provider && isFormValid) {
      const scheduleItem = {
        ...fields,
        network: connectedToNetwork!,
      } as IFormFields;
      const selectedContract = contracts[fields!.contractId!];

      const alerts = await validateBeforeSchedule(
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
    const isFormValid = validateForm();

    if (isFormValid) {
      handleScheduleAndSave();
      setAlerts([]);
    }
  };

  const handleScheduleAndSave = async () => {
    const provider = providers.find(
      (x) => x.config.contractAddress === fields?.providerAddress
    );

    setIsLoading(true);

    try {
      await schedule({
        title: fields!.title!,
        network: connectedToNetwork!,
        contractId: fields!.contractId!,
        contractMethod: fields!.contractAction!,
        contractFields: fields!.contractFields!,
        color: fields!.color!,
        executeAtISO: fields!.executeAt!,
        providerAddress: provider!.config.contractAddress,
        providerPlanIndex: fields!.providerPlanIndex!,
        value: "0",
        requestor: account!,
        isRecurrent: fields!.isRecurrent!,
        cronExpression: fields!.isRecurrent!
          ? fields!.cronFields!.expression!
          : undefined,
        quantity: fields!.isRecurrent! ? fields!.cronQuantity! : undefined,
      });

      handleClear();
    } catch (error) {
      const message = getMessageFromCode(error.code, error.message);

      enqueueSnackbar(message, {
        variant: "error",
      });
    }

    setIsLoading(false);
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
                  marginRight: 0,
                  marginLeft: 0,
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
                title={
                  fields?.cronFields?.description ??
                  "Failed to load the description"
                }
              >
                <TextField
                  disabled={isLoading || !fields?.isRecurrent}
                  margin="dense"
                  label="Recurrence expression"
                  variant="filled"
                  fullWidth
                  style={{ flex: 1, minWidth: 200 }}
                  onFocus={() => setCronFieldFocused(true)}
                  onBlur={() => setCronFieldFocused(false)}
                  value={fields?.cronFields?.description}
                  inputProps={{
                    style: {
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment
                        position="end"
                        style={{ paddingRight: 12 }}
                      >
                        <CronButton
                          onChange={handleCronFieldsChange}
                          value={fields?.cronFields ?? DEFAULT_CRON_FIELD}
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
                  value={fields?.providerAddress ? fields.providerAddress : ""}
                  onChange={handleFieldChange("providerAddress")}
                >
                  <MenuItem disabled>None</MenuItem>
                  {providers.map((provider) => (
                    <MenuItem
                      key={`schedule-provider-${provider.index}`}
                      value={provider.config.contractAddress}
                    >
                      {`Provider #${provider.index + 1}`}
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
                {!selectedProvider && (
                  <Select labelId="schedule-provider-plan">
                    <MenuItem disabled>None</MenuItem>
                  </Select>
                )}
                {selectedProvider && (
                  <DisplayPlansMenu
                    provider={selectedProvider}
                    value={`${
                      fields?.providerPlanIndex ? fields.providerPlanIndex : ""
                    }`}
                    onChange={handleFieldChange("providerPlanIndex")}
                  />
                )}
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
                  value={fields?.contractAction ? fields.contractAction : ""}
                  onChange={handleMethodChange}
                >
                  <MenuItem disabled>None</MenuItem>
                  {contractActions.map((method: any) => (
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

const DisplayPlansMenu: React.FC<{
  provider: IProviderSnapshot;
  onChange: (event: any) => void;
  value: string;
}> = ({ provider, value, onChange }) => {
  const [plans, loadPlans] = usePlans(provider);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    loadPlans().then(() => setIsLoading(false));
  }, [loadPlans]);

  return (
    <Select labelId="schedule-provider-plan" value={value} onChange={onChange}>
      <MenuItem disabled>{isLoading ? "loading..." : "None"}</MenuItem>
      {plans.map((plan) => (
        <MenuItem
          key={`schedule-provider-plan-${plan.index}`}
          value={`${plan.index}`}
        >
          <span style={{ fontWeight: "bold" }}>{`#${plan.index
            .add(1)
            .toString()}`}</span>
          <span style={{ marginLeft: 8 }}>{`Window: ${fromBigNumberToHms(
            plan.window
          )} - Gas limit: ${formatBigNumber(plan.gasLimit, 0)}`}</span>
        </MenuItem>
      ))}
    </Select>
  );
};

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
