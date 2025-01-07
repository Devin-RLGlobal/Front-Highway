const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware to parse JSON body
app.use(bodyParser.json());

// Setup Handlebars
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/src/pages');

// Serve static files
app.use(express.static('public'));

// Test Home Page
app.get('/', (req, res) => {
  res.render('index', { title: 'Front Plugin', message: 'Hello Front!' });
});

// Webhook Route
app.post('/webhook', (req, res) => {
  console.log('Webhook hit at:', new Date().toISOString());
  console.log('Payload:', req.body);

  res.status(200).send('Webhook received!');
});

app.get('/email', async (req, res) => {
  const url = 'https://staging.highway.com/core/connect/external_api/v1/carriers/email_search_associated_carriers';
  
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: 'Bearer ' + process.env.HIGHWAYAPITOKEN
    },
    data: {
      email: 'test@example.com'
    }
  };

  try {
    const response = await axios(url, options);
    console.log(response.data);
    res.json(response.data); // Send the response data back to the client
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
