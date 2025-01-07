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


app.post('/email', async (req, res) => {
  console.log('Request Body:', req.body);

  try {
    // Extract email, MC, and DOT numbers from the request body
    const { email, mc = [], dot = [] } = req.body;

    // Email Search Config
    let data1 = qs.stringify({ 'email': email || 'test@gmail.com' });

    let config1 = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://staging.gohighway.com/core/connect/external_api/v1/carriers/email_search_associated_carriers',
      headers: { 
        'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY, 
      },
      data: data1
    };

    // Create configs dynamically for each MC and DOT
    const dotConfigs = dot.map((dotNumber) => ({
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://staging.gohighway.com/core/connect/external_api/v1/carriers?q[identifiers_value_eq]=${dotNumber}&q[identifiers_is_type_eq]=DOT`,
      headers: { 
        'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY
      }
    }));

    const mcConfigs = mc.map((mcNumber) => ({
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://staging.gohighway.com/core/connect/external_api/v1/carriers?q[identifiers_value_eq]=${mcNumber}&q[identifiers_is_type_eq]=MC`,
      headers: { 
        'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY
      }
    }));

    // Execute all requests in parallel
    const [emailResponse, ...otherResponses] = await Promise.all([
      axios.request(config1),
      ...dotConfigs.map(config => axios.request(config)), // Process all DOT requests
      ...mcConfigs.map(config => axios.request(config))   // Process all MC requests
    ]);

    // Separate DOT and MC responses
    const dotResponses = otherResponses.slice(0, dotConfigs.length); // First N are DOT
    const mcResponses = otherResponses.slice(dotConfigs.length);     // Remaining are MC

    // Format combined data
    const combinedData = {
      emailSearch: emailResponse.data,
      dotSearch: dotResponses.map(res => res.data), // Map DOT responses
      mcSearch: mcResponses.map(res => res.data)    // Map MC responses
    };

    // Send response
    res.status(200).json(combinedData);

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data from Highway API' });
  }
});
app.listen(3000, () => console.log('Server running on http://localhost:3000'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
