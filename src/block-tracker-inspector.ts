import {
  createAsyncMiddleware,
  JsonRpcMiddleware,
} from 'json-rpc-engine';

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
const BlockTracker = require('eth-block-tracker');

const futureBlockRefRequests: string[] = ['eth_getTransactionByHash', 'eth_getTransactionReceipt'];

interface BlockTrackerInspectorMiddlewareOptions{
  blockTracker: typeof BlockTracker;
}
export = createBlockTrackerInspectorMiddleware;

// inspect if response contains a block ref higher than our latest block
function createBlockTrackerInspectorMiddleware(
  { blockTracker }: BlockTrackerInspectorMiddlewareOptions,
): JsonRpcMiddleware<string[], Record<string, unknown>> {
  return createAsyncMiddleware(async (req, res, next) => {
    if (!futureBlockRefRequests.includes(req.method)) {
      return next();
    }
    // eslint-disable-next-line node/callback-return
    await next();
    // abort if no result or no block number
    if (!res.result || !res.result.blockNumber) {
      return undefined;
    }
    // if number is higher, suggest block-tracker check for a new block
    const blockNumber: number = Number.parseInt((res.result as Record<string, string>).blockNumber, 16);
    const currentBlockNumber: number = Number.parseInt(blockTracker.getCurrentBlock(), 16);
    if (blockNumber > currentBlockNumber) {
      await blockTracker.checkForLatestBlock();
    }
    return next();
  });
}
