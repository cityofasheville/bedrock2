/* eslint-disable no-console */
const getRungroupList = require('./getRungroupList');
const getRungroup = require('./getRungroup');
const addRungroup = require('./addRungroup');
const updateRungroup = require('./updateRungroup');
const deleteRungroup = require('./deleteRungroup');

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

  switch (pathElements.length) {
    // GET rungroups
    case 1:
      result = await getRungroupList(
        event.requestContext.domainName,
        pathElements,
        queryParams,
        connection,
      );
      break;

    // VERB rungroups/{rungroupname}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getRungroup(pathElements, queryParams, connection);
          break;

        case 'POST':
          result = await addRungroup(
            event.body,
            pathElements,
            queryParams,
            connection,
          );
          break;

        case 'PUT':
          result = await updateRungroup(
            event.body,
            pathElements,
            queryParams,
            connection,
          );
          break;

        case 'DELETE':
          result = deleteRungroup(pathElements, queryParams, connection);
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

module.exports = handleRungroups;
