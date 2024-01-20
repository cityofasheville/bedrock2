/* eslint-disable no-console */
const getReference = require('./getReference');


// eslint-disable-next-line no-unused-vars
async function handleReference(
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
      result = await getReference(
        event.requestContext.domainName,
        pathElements,
        queryParams,
        connection,
      );
      break;

    // VERB rungroups/{rungroupname}
  //   case 2:
  //     switch (verb) {
  //       case 'GET':
  //         result = await getReference(pathElements, queryParams, connection);
  //         break;

  //       case 'POST':
  //         result.message = `POST endpoint not implemented for reference`;
  //         result.error = true;
  //         break;

  //       case 'PUT':
  //         result.message = `PUT endpoint not implemented for reference`;
  //         result.error = true;
  //         break;

  //       case 'DELETE':
  //         result.message = `DELETE endpoint not implemented for reference`;
  //         result.error = true;
  //         break;

  //       default:
  //         result.message = `handleRungroups: unknown verb ${verb}`;
  //         result.error = true;
  //         break;
  //     }
  //     break;

  //   default:
  //     result.message = `Unknown rungroups endpoint: [${pathElements.join()}]`;
  //     result.error = true;
  //     break;
   }
  if (result.error) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

module.exports = handleReference;
