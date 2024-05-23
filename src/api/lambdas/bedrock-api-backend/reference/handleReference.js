/* eslint-disable import/extensions */
/* eslint-disable import/extensions */
/* eslint-disable no-console */
import getReference from './getReference.js';


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
      // GET reference
      case 1:
        result = await getReference(
          event.requestContext.domainName,
          pathElements,
          queryParams,
          connection,
        );
        break;
    }
    if (result.error) {
      console.log('We have an error but do not know why!');
      console.log(result.message);
    }
  
    return result;
}

export default handleReference;
