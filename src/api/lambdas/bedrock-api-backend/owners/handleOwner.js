/* eslint-disable import/extensions */
/* eslint-disable no-console */
import getOwnerList from './getOwnerList.js';
import getOwner from './getOwner.js';
import addOwner from './addOwner.js';
import updateOwner from './updateOwner.js';
import deleteOwner from './deleteOwner.js';

async function handleOwners(
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
  const idField = 'owner_id';
  let idValue;
  const name = 'owner';
  const tableName = 'bedrock.owners';
  const requiredFields = ['owner_id', 'owner_name', 'owner_email'];
  const allFields = ['owner_id', 'owner_name', 'owner_email', 'owner_phone', 'organization', 'department', 'division', 'notes'];

  if (nParams === 2 && (pathElements[1] === null || pathElements[1].length === 0)) nParams = 1;
  if ('body' in event) {
    body = JSON.parse(event.body);
  }
  if (!(pathElements[1] == null)) {
    [, idValue] = pathElements;
  }

  switch (nParams) {
    // GET Owners
    case 1:
      switch (verb) {
        case 'GET':
          result = await getOwnerList(
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
          result = await addOwner(
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
          result.message = `handleOwners: unknown verb ${verb}`;
          result.statusCode = 404;
          break;
      } break;
    // VERB Owners/{Owner_name}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getOwner(
            db,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        case 'PUT':
          result = await updateOwner(
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
          result = await deleteOwner(
            db,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        default:
          result.message = `handleOwners: unknown verb ${verb}`;
          result.statusCode = 404;
          break;
      }
      break;

    default:
      result.message = `Unknown owners endpoint: [${pathElements.join()}]`;
      result.statusCode = 404;
      break;
  }
  if (result.statusCode !== 200) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

export default handleOwners;
