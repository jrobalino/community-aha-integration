import express from 'express';
import bodyParser from 'body-parser';
import { handleEvent } from './event-handler';

const app = express();
app.use(bodyParser.json());

const mockIdea = {
  'event': 'audit',
  'audit': {
    'audit_action': 'create',
    'user': {
      'email': 'javier.robalino@frontapp.com'
    },
    'auditable_url': 'https://example.com',
    'description': 'This is a test description',
    'auditable_type': 'ideas/idea'
  }
};

//handleEvent(mockIdea);

app.post('/aha-idea', (req, res) => {
  // Extract the event data from the request body
  const event = req.body;

  // Pass the event data to the event handler function
  handleEvent(event);

  // Send a success response to Aha
  res.send({ message: 'Success' });
});

app.listen(3000, () => {
  console.log('Webhook listener is listening on port 3000');
});