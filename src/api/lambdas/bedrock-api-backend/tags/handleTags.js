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
  let body;
  const idField = 'tag_name';
  let idValue;
  const name = 'tag';
  const tableName = 'tags';
  const requiredFields = ['tag_name', 'display_name'];

  if (nParams === 2 && (pathElements[1] === null || pathElements[1].length === 0)) nParams = 1;
  if ('body' in event) {
    body = JSON.parse(event.body);
  }
  console.log(pathElements);
  if (!(pathElements[1] == null)) {
    [, idValue] = pathElements;
  }

  switch (nParams) {
    // GET tags
    case 1:
      result = await getTagList(
        event.requestContext.domainName,
        pathElements,
        queryParams,
        connection,
        idField,
        name,
        tableName,
      );
      break;

    // VERB tags/{tag_name}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getTag(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        case 'POST':
          result = await addTag(
            connection,
            body,
            idField,
            idValue,
            name,
            tableName,
            requiredFields,
          );
          break;

        case 'PUT':
          result = await updateTag(
            connection,
            body,
            idField,
            idValue,
            name,
            tableName,
            requiredFields,
          );
          break;

        case 'DELETE':
          result = deleteTag(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
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
