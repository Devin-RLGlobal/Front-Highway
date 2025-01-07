const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');

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

app.get('/api/alerts', async (req, res) => {
  const express = require('express');
  const axios = require('axios');
  const router = express.Router();
  require('dotenv').config();
  
  router.post('/alerts', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Invalid email address' });
      }
  
      const url = 'https://highway.com/core/connect/external_api/v1/carriers/email_search_associated_carriers';
  
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.HIGHWAYAPIKEY}`,
      };
  
      const response = await axios.post(url, { email }, { headers });
  
      res.json(response.data);
  
    } catch (error) {
      // Log full error details
      console.error('Error fetching alerts:', error.message);
      console.error('Response Data:', error.response?.data || 'No response data');
  
      // Send appropriate error response
      res.status(error.response?.status || 500).json({
        error: 'Failed to fetch alerts',
        details: error.response?.data || 'Internal Server Error',
      });
    }
  });
  
  module.exports = router;  
});
// Listen on the port provided by Glitch or default to 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
