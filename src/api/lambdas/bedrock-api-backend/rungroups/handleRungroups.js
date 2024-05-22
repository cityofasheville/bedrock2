/* eslint-disable no-console */
import getRungroupList from './getRungroupList.js';
import getRungroup from './getRungroup.js';
import addRungroup from './addRungroup.js';
import updateRungroup from './updateRungroup.js';
import deleteRungroup from './deleteRungroup.js';

// eslint-disable-next-line no-unused-vars
async function handleRungroups(
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
  }

  switch (nParams) {
    // GET rungroups
    case 1:
      result = await getRungroupList(
        event.requestContext.domainName,
        pathElements,
        queryParams,
        connection,
        idField,
        name,
        tableName,
      );
      break;

    // VERB rungroups/{rungroupname}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getRungroup(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        case 'POST':
          result = await addRungroup(
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

        case 'PUT':
          result = await updateRungroup(
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
          result = deleteRungroup(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        default:
          result.message = `handleRungroups: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;

    default:
      result.message = `Unknown rungroups endpoint: [${pathElements.join()}]`;
      result.error = true;
      break;
  }
  if (result.error) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

export default handleRungroups;
