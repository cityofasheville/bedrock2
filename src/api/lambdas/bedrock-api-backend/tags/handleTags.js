/* eslint-disable no-console */
const getTagList = require('./getTagList');
const getTag = require('./getTag');
const addTag = require('./addTag');
const updateTag = require('./updateTag');
const deleteTag = require('./deleteTag');

// eslint-disable-next-line no-unused-vars
async function handleTags(
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
  if (nParams == 2 && (pathElements[1] === null || pathElements[1].length == 0)) nParams = 1;

  switch (nParams) {
    // GET rungroups
    case 1:
      result = await getTagList(
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
          result = await getTag(pathElements, queryParams, connection);
          break;

        case 'POST':
          result = await addTag(
            event.body,
            pathElements,
            queryParams,
            connection,
          );
          break;

        case 'PUT':
          result = await updateTag(
            event.body,
            pathElements,
            queryParams,
            connection,
          );
          break;

        case 'DELETE':
          result = deleteTag(pathElements, queryParams, connection);
          break;

        default:
          result.message = `handleTags: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;

    default:
      result.message = `Unknown tags endpoint: [${pathElements.join()}]`;
      result.error = true;
      break;
  }
  if (result.error) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

module.exports = handleTags;
