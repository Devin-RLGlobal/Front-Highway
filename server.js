const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const qs = require('qs');

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
  try {
    let data1 = qs.stringify({
      'email': 'test@gmail.com'
    });

    let config1 = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://staging.gohighway.com/core/connect/external_api/v1/carriers/email_search_associated_carriers',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY, 
      },
      data: data1
    };

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://staging.gohighway.com/core/connect/external_api/v1/carriers?q[identifiers_value_eq]=02478571&q[identifiers_is_type_eq]=DOT',
      headers: { 
        'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY
      }
    };

    let config3 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://staging.gohighway.com/core/connect/external_api/v1/carriers?q[identifiers_value_eq]=585644&q[identifiers_is_type_eq]=MC',
      headers: { 
        'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY
      }
    };

    const [response1, response2, response3] = await Promise.all([
      axios.request(config1),
      axios.request(config2),
      axios.request(config3)
    ]);

    const combinedData = {
      emailSearch: response1.data,
      dotSearch: response2.data,
      mcSearch: response3.data
    };

    res.status(200).json(combinedData);

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data from Highway API' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
