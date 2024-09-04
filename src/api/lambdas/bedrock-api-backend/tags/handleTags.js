/* eslint-disable import/extensions */
/* eslint-disable no-console */
import getTagList from './getTagList.js';
import getTag from './getTag.js';
import addTag from './addTag.js';
import updateTag from './updateTag.js';
import deleteTag from './deleteTag.js';

async function handleTags(
  event,
  pathElements,
  queryParams,
  verb,
  db,
) {
  let result = {
    statusCode: 200,
    message: '',
    result: null,
  };
  let nParams = pathElements.length;
  let body;
  const idField = 'tag_id';
  let idValue;
  const name = 'tag';
  const tableName = 'bedrock.tags';
  const requiredFields = ['tag_id', 'tag_name', 'display_name'];
  const allFields = ['tag_id', 'tag_name', 'display_name'];

  if (nParams === 2 && (pathElements[1] === null || pathElements[1].length === 0)) nParams = 1;
  if ('body' in event) {
    body = JSON.parse(event.body);
  }
  if (!(pathElements[1] == null)) {
    [, idValue] = pathElements;
  } else if (body) { // For POST requests, setting idValue here since it's not in the path
    idValue = body[idField];
  }

  switch (nParams) {
    // GET tags
    case 1:
      switch (verb) {
        case 'GET':
          result = await getTagList(
            event.requestContext.domainName,
            pathElements,
            queryParams,
            db,
            idField,
            name,
            tableName,
          );
          break;

        case 'POST':
          result = await addTag(
            db,
            allFields,
            body,
            idField,
            name,
            tableName,
            requiredFields,
          );
          break;

        default:
          result.message = `handleTags: unknown verb ${verb}`;
          result.statusCode = 404;
          break;
      } break;
    // VERB tags/{tag_name}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getTag(
            db,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        case 'PUT':
          result = await updateTag(
            db,
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
          result = await deleteTag(
            db,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        default:
          result.message = `handleTags: unknown verb ${verb}`;
          result.statusCode = 404;
          break;
      }
      break;

    default:
      result.message = `Unknown tags endpoint: [${pathElements.join()}]`;
      result.statusCode = 404;
      break;
  }
  if (result.statusCode !== 200) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

export default handleTags;
