import { addSeconds, parseISO } from "date-fns";
import { BigNumber, utils } from "ethers";
import { Execution, RIFScheduler } from "@rsksmart/rif-scheduler-sdk";
import { IContract } from "../contracts/useContracts";
import { useIndexedExecutionsStore } from "../sdk-hooks/useExecutions";
import { IProviderSnapshot } from "../sdk-hooks/useProviders";
import environment from "../shared/environment";
import { formatBigNumber, fromBigNumberToHms } from "../shared/formatters";
import { IScheduleFormDialogAlert } from "./ScheduleFormDialog";
import { ICronField } from "./cronParser/convertToCronExpression";

export interface IValidationInput {
  executeAt: string;
  providerAddress: string;
  providerPlanIndex: string;
  contractAction: string;
  contractFields: string[];
  isRecurrent: boolean;
  cronFields: ICronField;
  cronQuantity: number;
  contract: IContract;
  provider: IProviderSnapshot;
  myAccountAddress: string;
}

export const validateBeforeSchedule = async (
  validationInput: IValidationInput
): Promise<IScheduleFormDialogAlert[]> => {
  // TODO: add an input form for this value
  const valueToTransfer = BigNumber.from(0);

  const scheduler = new RIFScheduler(validationInput.provider.config);

  const plan = await scheduler.getPlan(
    BigNumber.from(validationInput.providerPlanIndex)
  );

  const result: IScheduleFormDialogAlert[] = [];

  const executionsQuantity = validationInput.isRecurrent
    ? validationInput.cronQuantity
    : 1;

  // validate purchased execution
  const hasAnExecutionLeft = (await plan.getRemainingExecutions()).gte(
    executionsQuantity
  );

  if (!hasAnExecutionLeft) {
    result.push({
      message: `You don't have ${formatBigNumber(
        BigNumber.from(executionsQuantity),
        0
      )} ${executionsQuantity === 1 ? "execution" : "executions"} left`,
      severity: "error",
      actionLabel: "Purchase more",
      actionLink: "/store",
    });
  }

  const encodedFunctionCall = new utils.Interface(
    validationInput.contract.ABI
  ).encodeFunctionData(
    validationInput.contractAction,
    validationInput.contractFields
  );

  const execution = new Execution(
    scheduler.config,
    plan,
    validationInput.contract.address,
    encodedFunctionCall,
    parseISO(validationInput.executeAt),
    valueToTransfer,
    validationInput.myAccountAddress
  );

  // if gasEstimation is undefined warn the user that the execution might fail
  const estimatedGas = await execution.estimateGas();
  if (!estimatedGas) {
    result.push({
      message:
        "We couldn't estimate the gas for the execution you want to schedule. " +
        "Hint: Make sure that all the parameters are correct and " +
        "that you will comply the execution requirements at the time of its execution.",
      severity: "warning",
    });
  }

  // estimatedGas is lower than the gas limit for the selected plan
  const isInsidePlanGasLimit = plan.gasLimit.gte(estimatedGas ?? 0);
  if (estimatedGas && !isInsidePlanGasLimit) {
    result.push({
      message:
        `The selected plan has a gas limit of ${formatBigNumber(
          plan.gasLimit,
          0
        )} which is lower that ` +
        `our estimation for this execution (${formatBigNumber(
          estimatedGas,
          0
        )}).`,
      severity: "warning",
    });
  }

  // validate minimum date/time
  const minimumDate = addSeconds(
    new Date(),
    environment.MINIMUM_TIME_BEFORE_EXECUTION
  );

  if (parseISO(validationInput.executeAt) <= minimumDate) {
    result.push({
      message: `You need to schedule at least ${fromBigNumberToHms(
        BigNumber.from(environment.MINIMUM_TIME_BEFORE_EXECUTION)
      )} in advance.`,
      severity: "error",
    });
  }

  // validate existing scheduled execution
  const executions = validationInput.isRecurrent
    ? Execution.fromCronExpression(
        execution,
        validationInput.cronFields?.expression!,
        +validationInput.cronQuantity!
      )
    : [execution];

  const executionsIds = executions.map((x) => x.getId());

  const existing = Object.values(
    useIndexedExecutionsStore.getState().indexedExecutions
  ).find(
    (index) =>
      executionsIds.includes(index.id!) &&
      index.providerAddress === validationInput.providerAddress
  );

  if (existing) {
    const message = validationInput.isRecurrent
      ? "One or more executions are already scheduled."
      : "This execution is already scheduled";

    result.push({
      message: message,
      severity: "error",
    });
  }

  return result;
};
