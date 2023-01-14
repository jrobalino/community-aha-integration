import * as https from 'https';
import * as dotenv from 'dotenv';

dotenv.config();

const clientId: string = process.env.CLIENT_ID!;
const clientSecret: string = process.env.CLIENT_SECRET!;

async function getAuthToken(clientId: string, clientSecret: string): Promise<string> {
// Retrieve an OAuth2 access token with write permissions from the Insided API
// https://api2-eu-west-1.insided.com/docs/#section/Authentication

  console.log('Retrieving an access token from Insided...');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api2-us-west-2.insided.com',
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          const token = jsonData.access_token;
          resolve(token);
        } catch (error) {
          reject(new Error(`Insided OAuth Request failed: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write('grant_type=client_credentials&client_id=' + clientId + '&client_secret=' + clientSecret + '&scope=write');
    req.end();
  });
};

function getUser(token: string, email: string): Promise<string | null> {
// Checks whether the user exists in the community
// https://api2-eu-west-1.insided.com/docs/user/#operation/findBy
  console.log('Checking for user...');
  
  return new Promise((resolve, reject) => {
    const options = {
    hostname: 'api2-us-west-2.insided.com',
    path: `/user/email/${email}`,
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': '/*/'
    }
  };

    // Make a GET request to the API
    const req = https.request(options, (res) => {
      // Check the response status code
      if (res.statusCode === 200) {
        // If the status code is 200, resolve the promise with the userId value
        res.on('data', (data) => {
          const userData = JSON.parse(data);
          resolve(userData.userid);
        });
      } else if (res.statusCode === 404) {
        // If the status code is 404, resolve the promise with a false value
        console.log('The user does not exist in the community');
        const userId = null;
        resolve(userId);
      } else {
        // If the status code is not 200 or 404, reject the promise with an error
        reject(new Error(`Insided Get User request failed: ${res.statusCode} ${res.statusMessage}`));
      }
    });

    req.on('error', (err) => {
      // Reject the promise if there is an error making the request
      reject(err);
    });

    req.end();

  });
};

async function submitIdea(token: string, authorId: string, title: string, content: string): Promise<void> {
  console.log('Submitting idea...');

  return new Promise((resolve, reject) => {
    // Set up the request options
    const options = {
      hostname: 'api2-us-west-2.insided.com',
      path: '/v2/ideas/submit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': '/*/'
      }
    };

    // Set the query string parameters
    const params = new URLSearchParams();
    params.set('authorId', authorId);
    options.path += `?${params.toString()}`;

    // Set up the request data
    const reqData = JSON.stringify({
      title: title,
      content: content
    });

    // Make a POST request to the API
    const req = https.request(options, (res) => {
      // Check the response status code
      if (res.statusCode === 201) {
        // If the status code is 201, resolve the promise
        console.log('Idea submitted!');
        resolve();
      } else if (res.statusCode === 422) {
        // If the idea has already been created 
        console.log('Idea has already been created');
        resolve();
      } else {
        // If the status code is not 201, reject the promise with an error
        reject(new Error(`Insided Submit Idea request failed: ${res.statusCode} ${res.statusMessage}`));
      }
    });

    // Handle errors
    req.on('error', (err) => {
      reject(err);
    });

    // Write the request data to the request body
    req.write(reqData);

    // End the request
    req.end();
  });
}

// Define a function to handle the event data
async function handleEvent(event: any): Promise<void> {

  // Check if the event data has an `audit` object with an `audit_action` value of `create`
  if (event.audit && event.audit.audit_action === 'create' && event.audit.auditable_type ==='ideas/idea') {
    // Extract the email value from the `user` object
    const email = event.audit.user.email;
    const title = 'AHA idea ' + event.audit.auditable_url;
    const content = event.audit.description + ' — Idea submitted in AHA and pushed to Insided via API';
    // Update the email variable only if the newEmail value is not null or undefined
    if (email) {
      try {
        const token = await getAuthToken(clientId, clientSecret);
        const user = await getUser(token, email);
        if (user) {
          await submitIdea(token, user, title, content);
        } else {
          console.log('Idea not attributed because user does not exist in the community.');
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  console.log(event);
}


export { handleEvent };
