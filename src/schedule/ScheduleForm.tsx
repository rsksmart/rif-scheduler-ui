import "date-fns";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardDateTimePicker,
  KeyboardDatePicker,
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
import { parseISO, isValid, set } from "date-fns";
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
import useField from "../shared/useField";
import { EMidday } from "./cronParser/enums";

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

const ScheduleForm = () => {
  const classes = useStyles();

  const [, , schedule] = useExecutions();

  const title = useField<string>();
  const executeAt = useField<string>();
  const providerAddress = useField<string>();
  const providerPlanIndex = useField<string>();
  const contractId = useField<string>();
  const contractAction = useField<string>();
  const contractFields = useField<string[]>([]);
  const color = useField<string>(null, false);
  const isRecurrent = useField<boolean>(false, false);
  const cronFields = useField<ICronField>(DEFAULT_CRON_FIELD);
  const cronQuantity = useField<string>("1");

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

  const handleProviderAddressChange = (event: any) => {
    providerAddress.onChange(event);
    providerPlanIndex.clear();
  };

  const handleContractChange = (event: any) => {
    contractId.onChange(event);
    contractAction.clear();
    contractFields.clear();
  };

  const handleMethodChange = (event: any) => {
    contractAction.onChange(event);
    contractFields.clear();
  };

  const handleCronQuantityIncrement = (increment: number) => (event: any) => {
    let quantity = cronQuantity.value ? +cronQuantity.value : 1;
    quantity = quantity === 1 ? 0 : quantity;
    quantity = quantity + increment;

    if (quantity <= 1) quantity = 1;

    cronQuantity.onChange({ target: { value: quantity.toString() } });
  };

  const handleCronQuantityChange = (event: any) => {
    let quantity = +event.target.value;

    if (quantity <= 1) quantity = 1;

    cronQuantity.onChange({ target: { value: quantity.toString() } });
  };

  const handleClear = () => {
    title.clear();
    executeAt.clear();
    providerAddress.clear();
    providerPlanIndex.clear();
    contractId.clear();
    contractAction.clear();
    contractFields.clear();
    color.clear();
    isRecurrent.clear();
    cronFields.clear();
    cronQuantity.clear();
  };

  const abi = contractId.value
    ? JSON.parse(contracts[contractId.value].ABI)
    : null;

  const contractActions = abi
    ? abi.filter((x: any) => x.type === "function")
    : [];

  const contractInputs =
    abi && contractAction.value
      ? abi.find(
          (x: any) => x.type === "function" && x.name === contractAction.value
        )?.inputs
      : undefined;

  const selectedProvider = providers.find(
    (provider) => provider.config.contractAddress === providerAddress.value
  );

  const validateForm = () => {
    [
      title,
      executeAt,
      providerAddress,
      providerPlanIndex,
      contractId,
      contractAction,
      contractFields,
      color,
      isRecurrent,
      cronFields,
      cronQuantity,
    ].forEach((field) => field.validate(contractInputs?.length ?? 1));

    const isValid =
      !title.error &&
      !contractId.error &&
      !contractAction.error &&
      !executeAt.error &&
      !providerAddress.error &&
      !providerPlanIndex.error &&
      !contractFields.error &&
      !cronQuantity.error &&
      !isRecurrent.error;

    return isValid;
  };

  const handleSchedule = async () => {
    const provider = providers.find(
      (x) => x.config.contractAddress === providerAddress.value
    );

    const isFormValid = validateForm();

    if (provider && isFormValid) {
      const selectedContract = contracts[contractId.value!];

      const alerts = await validateBeforeSchedule({
        contractAction: contractAction.value!,
        contractFields: contractFields.value!,
        cronFields: cronFields.value!,
        cronQuantity: +cronQuantity.value!,
        executeAt: executeAt.value!,
        isRecurrent: isRecurrent.value!,
        providerAddress: providerAddress.value!,
        providerPlanIndex: providerPlanIndex.value!,
        contract: selectedContract,
        provider,
        myAccountAddress: account!,
      });

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
    setIsLoading(true);

    try {
      let hours = cronFields.value!.hour;
      if (cronFields.value!.midday === EMidday.AM)
        hours = hours === 12 ? 0 : hours;

      if (cronFields.value!.midday === EMidday.PM)
        hours = hours === 12 ? 12 : hours + 12;

      const executeAtResult = isRecurrent.value!
        ? set(parseISO(executeAt.value!), {
            hours,
            minutes: cronFields.value!.minute,
            seconds: 0,
          })
        : set(parseISO(executeAt.value!), { seconds: 0 });

      await schedule({
        title: title.value!,
        network: connectedToNetwork!,
        contractId: contractId.value!,
        contractMethod: contractAction.value!,
        contractFields: contractFields.value!,
        color: color.value!,
        executeAtISO: executeAtResult.toISOString(),
        providerAddress: providerAddress.value!,
        providerPlanIndex: providerPlanIndex.value!,
        value: "0",
        requestor: account!,
        isRecurrent: isRecurrent.value!,
        cronExpression: isRecurrent.value!
          ? cronFields.value!.expression!
          : undefined,
        quantity: isRecurrent.value! ? cronQuantity.value! : undefined,
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
                onChange={title.onChange}
                onBlur={title.onBlur}
                value={title.value ? title.value : ""}
                error={title.error}
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
                    checked={isRecurrent.value!}
                    onChange={() =>
                      isRecurrent.onChange({
                        target: { value: !isRecurrent.value },
                      })
                    }
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
              {!isRecurrent.value && (
                <KeyboardDateTimePicker
                  disabled={isLoading}
                  margin="dense"
                  id="executeAt"
                  inputVariant="filled"
                  label={"Execute At"}
                  format="MM/dd/yyyy HH:mm"
                  fullWidth={true}
                  style={{ flex: 1, minWidth: 200 }}
                  value={executeAt.value ? parseISO(executeAt.value) : null}
                  onChange={(date: Date | null) => {
                    executeAt.onChange({
                      target: {
                        value:
                          date && isValid(date) ? date.toISOString() : null,
                      },
                    });
                  }}
                  KeyboardButtonProps={{
                    "aria-label": "change execute at",
                  }}
                  error={executeAt.error}
                />
              )}
              {isRecurrent.value && (
                <KeyboardDatePicker
                  disabled={isLoading}
                  margin="dense"
                  id="executeAt"
                  inputVariant="filled"
                  label={"Starts At"}
                  format="MM/dd/yyyy"
                  fullWidth={true}
                  style={{ flex: 1, minWidth: 200 }}
                  value={executeAt.value ? parseISO(executeAt.value) : null}
                  onChange={(date: Date | null) => {
                    executeAt.onChange({
                      target: {
                        value:
                          date && isValid(date) ? date.toISOString() : null,
                      },
                    });
                  }}
                  KeyboardButtonProps={{
                    "aria-label": "change start at",
                  }}
                  error={executeAt.error}
                />
              )}
              <CustomTooltip
                open={cronFieldFocused}
                title={
                  cronFields.value?.description ??
                  "Failed to load the description"
                }
              >
                <TextField
                  disabled={isLoading || !isRecurrent.value!}
                  margin="dense"
                  label="Recurrence expression"
                  variant="filled"
                  fullWidth
                  style={{ flex: 1, minWidth: 200 }}
                  onFocus={() => setCronFieldFocused(true)}
                  onBlur={() => setCronFieldFocused(false)}
                  value={cronFields.value?.description}
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
                          onChange={cronFields.onChange as any}
                          value={cronFields.value!}
                          disabled={isLoading || !isRecurrent.value!}
                        />
                      </InputAdornment>
                    ),
                  }}
                  error={cronFields.error}
                />
              </CustomTooltip>
              <TextField
                disabled={isLoading || !isRecurrent.value!}
                margin="dense"
                label="Executions quantity"
                variant="filled"
                fullWidth
                style={{ flex: 1, minWidth: 200 }}
                onChange={handleCronQuantityChange}
                value={cronQuantity.value ? cronQuantity.value : "1"}
                InputProps={{
                  inputComponent: NumberInput as any,
                  startAdornment: (
                    <InputAdornment position="start" style={{ paddingLeft: 0 }}>
                      <IconButton
                        size="small"
                        aria-label="sub 10 quantity"
                        onClick={handleCronQuantityIncrement(-10)}
                        edge="start"
                        disabled={isLoading || !isRecurrent.value!}
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
                        disabled={isLoading || !isRecurrent.value!}
                      >
                        <PlusIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={cronQuantity.error}
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
                error={providerAddress.error}
              >
                <InputLabel id="schedule-provider">Provider</InputLabel>
                <Select
                  labelId="schedule-provider"
                  value={providerAddress.value ? providerAddress.value : ""}
                  onChange={handleProviderAddressChange}
                  onBlur={providerAddress.onBlur}
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
                error={providerPlanIndex.error}
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
                    value={
                      providerPlanIndex.value ? providerPlanIndex.value : ""
                    }
                    onChange={providerPlanIndex.onChange}
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
                error={contractId.error}
              >
                <InputLabel id="schedule-contract">Contract</InputLabel>
                <Select
                  labelId="schedule-contract"
                  value={contractId.value ? contractId.value : ""}
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
                error={contractAction.error}
              >
                <InputLabel id="schedule-contract-method">Action</InputLabel>
                <Select
                  labelId="schedule-contract-method"
                  value={contractAction.value ? contractAction.value : ""}
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
                    error={contractFields.error}
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
                    onChange={(event) => contractFields.onChange(event, index)}
                    value={
                      contractFields.value ? contractFields.value[index] : ""
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
            value={color.value ? color.value : ""}
            onChange={color.onChange as any}
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
