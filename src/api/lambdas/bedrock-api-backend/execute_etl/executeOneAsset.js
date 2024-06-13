import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const client = new SFNClient({ region: 'us-east-1' });

async function invoke(input) {
  let executionName = 'API-OneAsset-' + Array(20).fill(0).map(x => Math.random().toString(36).charAt(2)).join('');
    const command = new StartExecutionCommand({
        input: JSON.stringify(input),
        name: executionName,
        stateMachineArn: process.env.STATE_MACHINE_ARN
    });
    let { startDate } = await client.send(command);
    return `Execution ${executionName} started at ${startDate.toISOString()}`;
}

async function executeOneAsset(assetName) {
  try {
    let result = {
      error: false,
      message: 'Asset executed successfully',
      result: null,
    };
    console.log('executeOneAsset', assetName);
    let ret = await invoke({one_asset: assetName});
    result.result = ret;
    return result;

  } catch (error) {
    return {
      error: true,
      message: error.message,
      result: null,
    };
  }
}

export default executeOneAsset;