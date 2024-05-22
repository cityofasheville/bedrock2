/* eslint-disable no-console */
import getRunGroupList from './getRunGroupList.js';
import getRunGroup from './getRunGroup.js';
import addRunGroup from './addRunGroup.js';
import updateRunGroup from './updateRunGroup.js';
import deleteRunGroup from './deleteRunGroup.js';

// eslint-disable-next-line no-unused-vars
async function handleRunGroups(
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
  const idField = 'run_group_name';
  let idValue;
  const name = 'run_group';
  const tableName = 'run_groups';
  const requiredFields = ['run_group_name', 'cron_string'];
  const allFields = ['run_group_name', 'cron_string'];

  if (nParams === 2 && (pathElements[1] === null || pathElements[1].length === 0)) nParams = 1;
  if ('body' in event) {
    body = JSON.parse(event.body);
  }
  console.log(pathElements);
  if (!(pathElements[1] == null)) {
    [, idValue] = pathElements;
  } else if (body) { // For POST requests, setting idValue here since it's not in the path
    idValue = body[idField];
  }

  switch (nParams) {
    // GET run_groups
    case 1:
      switch (verb) {
        case 'GET':
          result = await getRunGroupList(
            event.requestContext.domainName,
            pathElements,
            queryParams,
            connection,
            idField,
            name,
            tableName,
          );
          break;

        case 'POST':
          result = await addRunGroup(
            connection,
            allFields,
            body,
            idField,
            idValue,
            name,
            tableName,
            requiredFields,
          );
          break;

        default:
          result.message = `handleRunGroups: unknown verb ${verb}`;
          result.error = true;
          break;
      } break;

    // VERB rungroups/{rungroupname}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getRunGroup(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        case 'PUT':
          result = await updateRunGroup(
            connection,
            allFields,
            body,
            idField,
            idValue,
            name,
            tableName,
            requiredFields,
          );
          break;

        case 'DELETE':
          result = deleteRunGroup(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        default:
          result.message = `handleRunGroups: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;

    default:
      result.message = `Unknown runGroups endpoint: [${pathElements.join()}]`;
      result.error = true;
      break;
  }
  if (result.error) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

export default handleRunGroups;
