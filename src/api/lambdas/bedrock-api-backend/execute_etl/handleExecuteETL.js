import executeRunGroup from './executeRunGroup.js';
import executeOneAsset from './executeOneAsset.js';
``
async function handleExecuteETL(
  event,
  pathElements,
  queryParams,
  verb,
  connection,
) {
  let result = {
    error: false,
    message: '',
    result: null,
  };
  let nParams = pathElements.length;
  let body;
  let idValue;

  if (nParams === 2 && (pathElements[1] === null || pathElements[1].length === 0)) nParams = 1;
  if ('body' in event) {
    body = JSON.parse(event.body);
  }
  if (!(pathElements[1] == null)) {
    [, idValue] = pathElements;
  } else if (body) { // For POST requests, setting idValue here since it's not in the path
    idValue = body[idField];
  }

  console.log("event:", JSON.stringify(event, null, 2));
  console.log("pathElements", pathElements);
  console.log("nParams", nParams);

  switch (nParams) {
    case 3:
      if (idValue === 'run_group') {
        // /execute_etl/run_group/{{run_group_name}}
        switch (verb) {
          case 'GET':
            result = await executeRunGroup(
              pathElements[2],
            );
            break;

          default:
            result.message = `handleExecuteETL: unknown verb ${verb}`;
            result.error = true;
            break;
        }
      } else if (idValue === 'one_asset') {
        // /execute_etl/one_asset/{{asset_name}}
        switch (verb) {
          case 'GET':
            result = await executeOneAsset(
              pathElements[2],
            );
            break;

          default:
            result.message = `handleExecuteETL: unknown verb ${verb}`;
            result.error = true;
            break;
        }
      } else {
        result.message = `Unknown execute_etl endpoint: [${pathElements.join()}]`;
        result.error = true;
      }
      break;

    default:
      result.message = `Unknown execute_etl endpoint: [${pathElements.join()}]`;
      result.error = true;
      break;
  }
  if (result.error) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

export default handleExecuteETL;
