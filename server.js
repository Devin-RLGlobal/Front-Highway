const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();
const qs = require('qs');

const app = express();

app.use(bodyParser.json());

app.engine('hbs', exphbs.engine({ extname: '.hbs' }));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/src/pages');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index', { title: 'Front Plugin', message: 'Hello Front!' });
});


// Middleware for verifying Front webhook signature
function verifySignature(req, res, next) {
  try {
    const signature = req.headers['x-front-signature'];
    const timestamp = req.headers['x-front-timestamp'];

    // Check for required headers
    if (!signature || !timestamp) {
      return res.status(401).send('Missing signature headers');
    }

    // Compute expected signature
    const secret = process.env.FRONT_WEBHOOK_SECRET;
    const body = JSON.stringify(req.body);
    const baseString = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(baseString)
      .digest('hex');

    // Compare signatures
    if (signature !== expectedSignature) {
      return res.status(401).send('Invalid signature');
    }

    // Continue processing if verified
    next();
  } catch (err) {
    console.error('Error verifying signature:', err);
    return res.status(500).send('Internal Server Error');
  }
}

// Updated webhook endpoint
app.post('/webhook', verifySignature, (req, res) => {
  console.log('Webhook verified at:', new Date().toISOString());
  console.log('Payload:', req.body);

  // Respond with success after processing the payload
  res.status(200).send('Webhook verified successfully!');
});



app.post('/email', async (req, res) => {

  try {
    const { email, mc = [], dot = [] } = req.body;

    const cleanMC = mc.map(num => num.replace(/MC/i, '').trim());
    const cleanDOT = dot.map(num => num.replace(/DOT/i, '').trim());

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

    const dotConfigs = cleanDOT.map(dotNumber => {
      return {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://staging.gohighway.com/core/connect/external_api/v1/carriers?q[identifiers_value_eq]=${dotNumber}&q[identifiers_is_type_eq]=DOT`,
        headers: { 
          'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY
        }
      };
    });

    const mcConfigs = cleanMC.map(mcNumber => {
      return {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://staging.gohighway.com/core/connect/external_api/v1/carriers?q[identifiers_value_eq]=${mcNumber}&q[identifiers_is_type_eq]=MC`,
        headers: { 
          'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY
        }
      };
    });

    const [emailResponse, ...otherResponses] = await Promise.all([
      axios.request(config1),
      ...dotConfigs.map(config => axios.request(config)),
      ...mcConfigs.map(config => axios.request(config))
    ]);

    const dotResponses = otherResponses.slice(0, dotConfigs.length);
    const mcResponses = otherResponses.slice(dotConfigs.length);
    const combinedData = {
      emailSearch: emailResponse.data,
      dotSearch: dotResponses.map(res => res.data),
      mcSearch: mcResponses.map(res => res.data)
    };

    res.status(200).json(combinedData);

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data from Highway API' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
