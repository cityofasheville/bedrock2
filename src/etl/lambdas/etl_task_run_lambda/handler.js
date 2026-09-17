
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

export const lambda_handler = async function x(event, context) {
  let TaskIndex = event.TaskIndex;
  let FunctionName = event.ETLJob.etl_tasks[TaskIndex].lambda_arn;
  let config = {
    region: 'us-east-1'
  };
  let input = {
    FunctionName,
    InvocationType: 'RequestResponse',
    LogType: 'Tail', // include the execution log in the response
    Payload: JSON.stringify(event)
  };

  const client = new LambdaClient(config);
  const command = new InvokeCommand(input);
  const response = await client.send(command);
  const lambda_output = FunctionName + ':\n' + Buffer.from(response.LogResult, 'base64').toString('utf-8');
  console.log(lambda_output);

  if (response.FunctionError) {
    const errorPayload = JSON.parse(Buffer.from(response.Payload).toString('utf-8'));
    throw new Error(`${FunctionName} failed: ${errorPayload.errorMessage || JSON.stringify(errorPayload)}`);
  }

  return {
    statusCode: response.StatusCode,
    body: {
      lambda_output: lambda_output
    },
  };
}
