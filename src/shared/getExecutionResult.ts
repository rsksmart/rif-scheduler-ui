import { Contract, utils } from "ethers";
import { providers } from "ethers";
import { addSeconds, differenceInMinutes, subSeconds } from "date-fns"
import { IScheduleItem } from "../schedule/useSchedule";
import { ExecutionState } from "@rsksmart/rif-scheduler-sdk";

const PROMISE_PARALLEL_NUMBER = 4 * 4

export interface IExecutedEventInfo {
    id: string;
    result: string,
    success: boolean
}

export interface IExecutedTransaction {
    event: IExecutedEventInfo;
    txHash: string;
}

const getExecutedTransaction = async (contractAddress: string, provider: providers.Provider, window: number, execution: IScheduleItem) => {
    if (
        !execution.id ||
        ![ExecutionState.ExecutionSuccessful, ExecutionState.ExecutionFailed]
            .includes(execution.state ?? ExecutionState.Nonexistent)
    ) {
        return null
    }
    
    console.time("getExecutionResult")

    const blocksProcessed: number[] = []
    const addProcess = (initialBlock: number, offset: number) => {
        const processing = initialBlock + offset
        if (!blocksProcessed.includes(processing)) {
            blocksProcessed.push(processing)
            return getEventIfExist(provider, processing, contractAddress, execution)
        }
    }

    const executeAt = new Date(execution.executeAt)

    const scheduledTx = await provider.getTransaction(execution.scheduledTx!)

    const scheduledBlockNumber = scheduledTx.blockNumber!
    const lastBlockNumber = await provider.getBlockNumber();
    
    const { 
        blocksRate,
        fromDate: scheduledDate 
    } = await getBlocksRateByMinute(provider, scheduledBlockNumber, lastBlockNumber)
    
    const blockNumberExecuteAtMid = getEstimatedBlockNumber(executeAt, scheduledDate, scheduledBlockNumber, blocksRate)
    const blockNumberExecuteAtLow = getEstimatedBlockNumber(subSeconds(executeAt, window), scheduledDate, scheduledBlockNumber, blocksRate)
    const blockNumberExecuteAtUpper = getEstimatedBlockNumber(addSeconds(executeAt, window), scheduledDate, scheduledBlockNumber, blocksRate)
    
    const lowWindowBlock = Math.trunc(Math.max(blockNumberExecuteAtLow, scheduledBlockNumber))
    const upperWindowBlock = Math.trunc(Math.min(blockNumberExecuteAtUpper, lastBlockNumber))
    const midBlockNumber = Math.trunc(blockNumberExecuteAtMid)

    let foundedEvent: IExecutedTransaction | null = null
    let counter = 0;
    let running = []
    while(!foundedEvent) {        
        running.push(addProcess(lowWindowBlock, counter))

        running.push(addProcess(midBlockNumber, -counter))
        
        running.push(addProcess(midBlockNumber, counter))
        
        running.push(addProcess(upperWindowBlock, -counter))

        if (running.length === PROMISE_PARALLEL_NUMBER)
        {
            const runResult = await Promise.all(running)
    
            foundedEvent = runResult.find(x => x ? true : false) ?? null

            running = []
        }

        counter++
    }

    return foundedEvent
}

const getBlocksRateByMinute = async (provider: providers.Provider, fromBlockNumber: number, toBlockNumber: number) => {
    const fromBlock = await provider.getBlock(fromBlockNumber)
    const toBlock = await provider.getBlock(toBlockNumber)
    const fromDate = new Date(+fromBlock.timestamp * 1000)
    const toDate = new Date(+toBlock.timestamp * 1000)

    const diffInMinutes = differenceInMinutes(toDate, fromDate)
    const diffInBlocks = toBlockNumber - fromBlockNumber
    const blocksRate = diffInBlocks / diffInMinutes

    return { blocksRate, fromBlock, toBlock, fromDate, toDate }
}

const getEstimatedBlockNumber = (date: Date, fromDate: Date, initialBlockNumber: number, blocksRate: number) => {
    return initialBlockNumber + differenceInMinutes(date, fromDate) * blocksRate
}

const getEventIfExist = async (provider: providers.Provider, blockNumber: number, contractAddress: string, execution: IScheduleItem): Promise<IExecutedTransaction | null> => {
    const abi = [ "event Executed(bytes32 indexed id, bool success, bytes result)" ];
    const eventInterface = new utils.Interface(abi);
    const rifSchedulerContract = new Contract(
        contractAddress,
        abi,
        provider
      );
    
    const executeId = execution.id?.substr(2)
    const filterByExecutionId = rifSchedulerContract.filters.Executed(execution.id);
    const filterTopics = filterByExecutionId.topics as string[]

    const searchingBlock = await provider.getBlockWithTransactions(blockNumber)

    const filteredTxs = searchingBlock.transactions
       .filter(
            x => x.to?.toLowerCase() === contractAddress.toLowerCase() && 
                 x.data.includes(executeId!)
    )

    for (const tx of filteredTxs) {
        const receipt = await provider.getTransactionReceipt(tx.hash)

        const log = receipt.logs.find(x => areEquals(x.topics, filterTopics))

        if (log) {
            const result: IExecutedEventInfo = eventInterface.parseLog(log).args as any
            console.timeEnd("getExecutionResult")
            console.log("getExecutionResult", result)
            return {
                event: result,
                txHash: tx.hash
            }
        }
    }

    return null
}

const areEquals = (a1: string[], a2: string[]) => a1.length === a2.length && a1.every((value, index) => value === a2[index])

export default getExecutedTransaction