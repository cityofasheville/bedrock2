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
  connection,
) {
  let result = {
    error: false,
    message: '',
    result: null,
  };
  let nParams = pathElements.length;
  let body;
  const idField = 'owner_id';
  let idValue;
  const name = 'owner';
  const tableName = 'owners';
  const requiredFields = ['owner_id', 'contact_name', 'contact_email'];
  const allFields = ['owner_id', 'contact_name', 'contact_email', 'contact_phone', 'organization', 'department', 'division', 'notes'];

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
            connection,
            idField,
            name,
            tableName,
          );
          break;

        case 'POST':
          result = await addOwner(
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
          result.message = `handleOwners: unknown verb ${verb}`;
          result.error = true;
          break;
      } break;
    // VERB Owners/{Owner_name}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getOwner(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        case 'PUT':
          result = await updateOwner(
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
          result = deleteOwner(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        default:
          result.message = `handleOwners: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;

    default:
      result.message = `Unknown owners endpoint: [${pathElements.join()}]`;
      result.error = true;
      break;
  }
  if (result.error) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

export default handleOwners;
