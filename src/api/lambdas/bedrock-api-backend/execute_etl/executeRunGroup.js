import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const sfn_client = new SFNClient({ region: 'us-east-1' });

async function invoke(input) {
  let executionName = 'API-RunGroup-' + Array(20).fill(0).map(x => Math.random().toString(36).charAt(2)).join('');
    const command = new StartExecutionCommand({
        input: JSON.stringify(input),
        name: executionName,
        stateMachineArn: process.env.STATE_MACHINE_ARN
    });
    let { startDate } = await sfn_client.send(command);
    return `Execution ${executionName} started at ${startDate.toISOString()}`;
}

async function executeRunGroup(runGroupName) {
  let result = {
    statusCode: 200,
    message: 'Run group executed successfully',
    result: null,
  };
  console.log('executeRunGroup', runGroupName);
  let ret = await invoke({run_group: runGroupName});
  result.result = ret;  
  return result;
}

export default executeRunGroup;