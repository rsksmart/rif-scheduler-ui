import { Contract, utils } from "ethers";
import { providers } from "ethers";
import { addSeconds, differenceInMinutes, subSeconds } from "date-fns";
import { EExecutionState, Execution } from "@rsksmart/rif-scheduler-sdk";

// PROMISE_PARALLEL_NUMBER needs to be a multiple of 4,
// because the getExecutedTransactions throws 4 threads simultaneously each iteration
const PROMISE_PARALLEL_NUMBER = 4 * 4;

export interface IExecutedEventInfo {
  id: string;
  result: string;
  success: boolean;
}

export interface IExecutedTransaction {
  event: IExecutedEventInfo;
  txHash: string;
}

const getExecutedTransaction = async (
  scheduledTxHash: string,
  execution: Execution
) => {
  const provider = execution.provider as any;
  const contractAddress = execution.config.contractAddress;
  const window = execution.plan.window.toNumber();

  const state = await execution.getState();

  if (
    ![
      EExecutionState.ExecutionSuccessful,
      EExecutionState.ExecutionFailed,
    ].includes(state)
  ) {
    return null;
  }

  const blocksProcessed: number[] = [];
  const addProcess = (initialBlock: number, offset: number) => {
    const processing = initialBlock + offset;
    if (!blocksProcessed.includes(processing)) {
      blocksProcessed.push(processing);
      return getEventIfExist(provider, processing, contractAddress, execution);
    }
  };

  const executeAt = new Date(execution.executeAt);

  const scheduledTx = await provider.getTransaction(scheduledTxHash);

  const scheduledBlockNumber = scheduledTx.blockNumber!;
  const lastBlockNumber = await provider.getBlockNumber();

  const { blocksRate, fromDate: scheduledDate } = await getBlocksRateByMinute(
    provider,
    scheduledBlockNumber,
    lastBlockNumber
  );

  const blockNumberExecuteAtMid = getEstimatedBlockNumber(
    executeAt,
    scheduledDate,
    scheduledBlockNumber,
    blocksRate
  );
  const blockNumberExecuteAtLow = getEstimatedBlockNumber(
    subSeconds(executeAt, window),
    scheduledDate,
    scheduledBlockNumber,
    blocksRate
  );
  const blockNumberExecuteAtUpper = getEstimatedBlockNumber(
    addSeconds(executeAt, window),
    scheduledDate,
    scheduledBlockNumber,
    blocksRate
  );

  const lowWindowBlock = Math.trunc(
    Math.max(blockNumberExecuteAtLow, scheduledBlockNumber)
  );
  const upperWindowBlock = Math.trunc(
    Math.min(blockNumberExecuteAtUpper, lastBlockNumber)
  );
  const midBlockNumber = Math.trunc(blockNumberExecuteAtMid);

  let foundedEvent: IExecutedTransaction | null = null;
  let counter = 0;
  let running = [];
  while (!foundedEvent) {
    running.push(addProcess(lowWindowBlock, counter));

    running.push(addProcess(midBlockNumber, -counter));

    running.push(addProcess(midBlockNumber, counter));

    running.push(addProcess(upperWindowBlock, -counter));

    if (running.length === PROMISE_PARALLEL_NUMBER) {
      const runResult = await Promise.all(running);

      foundedEvent = runResult.find((x) => (x ? true : false)) ?? null;

      running = [];
    }

    counter++;
  }

  return foundedEvent;
};

const getBlocksRateByMinute = async (
  provider: providers.Provider,
  fromBlockNumber: number,
  toBlockNumber: number
) => {
  const fromBlock = await provider.getBlock(fromBlockNumber);
  const toBlock = await provider.getBlock(toBlockNumber);
  const fromDate = new Date(+fromBlock.timestamp * 1000);
  const toDate = new Date(+toBlock.timestamp * 1000);

  const diffInMinutes = differenceInMinutes(toDate, fromDate);
  const diffInBlocks = toBlockNumber - fromBlockNumber;
  const blocksRate = diffInBlocks / diffInMinutes;

  return { blocksRate, fromBlock, toBlock, fromDate, toDate };
};

const getEstimatedBlockNumber = (
  date: Date,
  fromDate: Date,
  initialBlockNumber: number,
  blocksRate: number
) => {
  return initialBlockNumber + differenceInMinutes(date, fromDate) * blocksRate;
};

const getEventIfExist = async (
  provider: providers.Provider,
  blockNumber: number,
  contractAddress: string,
  execution: Execution
): Promise<IExecutedTransaction | null> => {
  const abi = [
    "event Executed(bytes32 indexed id, bool success, bytes result)",
  ];
  const eventInterface = new utils.Interface(abi);
  const rifSchedulerContract = new Contract(contractAddress, abi, provider);

  const executeId = execution.getId().substr(2);
  const filterByExecutionId = rifSchedulerContract.filters.Executed(
    execution.getId()
  );
  const filterTopics = filterByExecutionId.topics as string[];

  const searchingBlock = await provider.getBlockWithTransactions(blockNumber);

  const filteredTxs = searchingBlock.transactions.filter(
    (x) =>
      x.to?.toLowerCase() === contractAddress.toLowerCase() &&
      x.data.includes(executeId!)
  );

  for (const tx of filteredTxs) {
    const receipt = await provider.getTransactionReceipt(tx.hash);

    const log = receipt.logs.find((x) => areEquals(x.topics, filterTopics));

    if (log) {
      const result: IExecutedEventInfo = eventInterface.parseLog(log)
        .args as any;

      return {
        event: result,
        txHash: tx.hash,
      };
    }
  }

  return null;
};

const areEquals = (a1: string[], a2: string[]) =>
  a1.length === a2.length && a1.every((value, index) => value === a2[index]);

export default getExecutedTransaction;
