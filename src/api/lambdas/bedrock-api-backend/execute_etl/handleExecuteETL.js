import executeRunGroup from './executeRunGroup.js';
import executeOneAsset from './executeOneAsset.js';
``
async function handleExecuteETL(
  event,
  pathElements,
  queryParams,
  verb,
  client,
) {
  let result = {
    statusCode: 200,
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

  // console.log("event:", JSON.stringify(event, null, 2));
  // console.log("pathElements", pathElements);
  // console.log("nParams", nParams);

  switch (nParams) {
    case 3:
      if (idValue === 'run_group') {
        // /execute_etl/run_group/{{run_group_name}}
        switch (verb) {
          case 'POST':
            result = await executeRunGroup(
              pathElements[2],
            );
            break;

          default:
            result.message = `handleExecuteETL: unknown verb ${verb}`;
            result.statusCode = 404;
            break;
        }
      } else if (idValue === 'one_asset') {
        // /execute_etl/one_asset/{{asset_name}}
        switch (verb) {
          case 'POST':
            result = await executeOneAsset(
              pathElements[2],
            );
            break;

          default:
            result.message = `handleExecuteETL: unknown verb ${verb}`;
            result.statusCode = 404;
            break;
        }
      } else {
        result.message = `Unknown execute_etl endpoint: [${pathElements.join()}]`;
        result.statusCode = 404;
      }
      break;

    default:
      result.message = `Unknown execute_etl endpoint: [${pathElements.join()}]`;
      result.statusCode = 404;
      break;
  }
  if (result.statusCode !== 200) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

export default handleExecuteETL;
