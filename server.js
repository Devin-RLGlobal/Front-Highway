const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();
const qs = require('qs');
const crypto = require('crypto');
const fs = require('fs');


const app = express();
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/src/pages');

app.use(express.static('public'));
app.use('/webhook', bodyParser.raw({ type: '*/*' }));
const applicationSecret = process.env.FRONTSECRET;


const rawData = fs.readFileSync('domains.json');
const { domains } = JSON.parse(rawData);

const domainSet = new Set(domains);

app.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-front-signature'];
    const xFrontChallenge = req.headers['x-front-challenge'];
    const timestamp = req.headers['x-front-request-timestamp'] + ':';

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
    const concatenated = Buffer.concat([Buffer.from(timestamp, 'utf-8'), rawBody]);

    const hashed = crypto
      .createHmac('sha256', applicationSecret)
      .update(concatenated)
      .digest('base64');

    if (hashed === signature) {
      console.log("Signature validation successful");

      let parsedBody;
      try {
        parsedBody = JSON.parse(req.body.toString('utf-8'));
      } catch (err) {
        console.error('Error parsing webhook body:', err);
        return res.status(400).send('Invalid JSON');
      }

      const payload = parsedBody.payload || {};
      const target = payload.target || {};
      const data = target.data || {};

      const recipients = data.recipients || [];
      const sender = recipients.find(r => r.role === 'from');
      const senderEmail = sender ? sender.handle : 'Unknown';

      const plainTextBody = data.text || 'No plain text body';

      let numResult = getNumbers(plainTextBody);
      let mcnums = numResult['mc'];
      let dotnums = numResult['dot'];

      const conversationId = payload.conversation.id;

      if (checkDomain() == false && await callMcleod(senderEmail) == false &&  await callHighway({ email: senderEmail, mc: mcnums, dot: dotnums }) == false){


        const options = {
          method: 'POST',
          url: 'https://api2.frontapp.com/conversations/'+conversationId+'/tags',
          headers: {
            'content-type': 'application/json',
            authorization: 'Bearer ' + process.env.FRONTAPITOKEN
          },
          data: {tag_ids: ['tag_4yeuak']}
        };
        
        axios
          .request(options)
          .then(res => console.log(res.data))
          .catch(err => console.error(err));

      }

      else{
        const options = {
          method: 'POST',
          url: 'https://api2.frontapp.com/conversations/'+conversationId+'/tags',
          headers: {
            'content-type': 'application/json',
            authorization: 'Bearer ' + process.env.FRONTAPITOKEN
          },
          data: {tag_ids: ['tag_4yeucc']}
        };
        
        axios
          .request(options)
          .then(res => console.log(res.data))
          .catch(err => console.error(err));
      }
      const acceptHeader = req.headers['accept'];
      if (acceptHeader === 'application/json') {
        return res.status(200).json({ challenge: xFrontChallenge });
      } else if (acceptHeader === 'application/x-www-form-urlencoded') {
        return res.status(200).send(`challenge=${xFrontChallenge}`);
      } else {
        return res.status(200).type('text/plain').send(xFrontChallenge);
      }
    } else {
      console.error("Signature validation failed");
      return res.status(400).send('Bad Request: validation failed');
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).send('Internal Server Error');
  }
});



app.use(bodyParser.json());


app.get('/', (req, res) => {
  res.render('index', { title: 'Front Plugin', message: 'Hello Front!' });
});



function checkDomain(domain) {
    return domainSet.has(domain);
}


async function callHighway(reqData) {
  try {
    const response = await axios.post('https://dolphin-app-w5254.ondigitalocean.app/highway', reqData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    if(response.data.emailSearch.email_search_result_category == 'email_and_email_domain_not_known'){
      return false
    }
    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return true;

  } catch (error) {
    console.error('Error calling /highway route:', error.message);
    throw error;
  }
}


async function callMcleod(reqData) {
  let isActive = false;
  let firstResponseData = null;
  let secondResponseData = null;

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://dolphin-app-w5254.ondigitalocean.app/carriers',
    headers: {
      'Content-Type': 'application/json',
    },
    data: { email: reqData },
  };

  try {
    const response = await axios.request(config);
    firstResponseData = response?.data;

    if (!firstResponseData || firstResponseData.length === 0) {
      return { isActive: false, firstResponseData, secondResponseData };
    }

    const id = firstResponseData[0].id;
    isActive = firstResponseData[0].status === 'A';

    console.log('ID:', id);
    console.log('Is Active after first request:', isActive);

    if (!isActive) {
      let formData = new FormData();
      let secondConfig = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://servicestruckload.stgextrlc.net/ws/contact/search?email=${reqData}`,
        headers: {
          Accept: 'application/json',
          'X-com.mcleodsoftware.CompanyID': 'TMS',
          Authorization: 'Token 0392833a-76cb-4ccc-9d61-ccf3ba49ef86',
          ...formData.getHeaders(),
        },
        data: formData,
      };

      try {
        const secondResponse = await axios.request(secondConfig);
        secondResponseData = secondResponse?.data;

        if (Object.keys(secondResponseData).length === 0) {
          isActive = false;
        }

        console.log('Second Request Data:', JSON.stringify(secondResponseData));
      } catch (secondError) {
        console.log('Error in second request:', secondError);
      }
    }

    return { isActive, firstResponseData, secondResponseData };
  } catch (error) {
    console.log('Error in callMcleod:', error);
    return { isActive: false, firstResponseData, secondResponseData };
  }
}



app.post('/highway', async (req, res) => {
  try {
    const { email, mc = [], dot = [] } = req.body;

    const cleanMC = mc.map(num => num.replace(/MC/i, '').trim());
    const cleanDOT = dot.map(num => num.replace(/DOT/i, '').trim());

    let config1 = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://staging.gohighway.com/core/connect/external_api/v1/carriers/email_search_associated_carriers',
      headers: {
        'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY,
      },
      data: qs.stringify({ email: email || 'test@gmail.com' }),
    };

    const dotConfigs = cleanDOT.map(dotNumber => ({
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://staging.gohighway.com/core/connect/external_api/v1/carriers?q[identifiers_value_eq]=${dotNumber}&q[identifiers_is_type_eq]=DOT`,
      headers: {
        'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY,
      },
    }));

    const mcConfigs = cleanMC.map(mcNumber => ({
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://staging.gohighway.com/core/connect/external_api/v1/carriers?q[identifiers_value_eq]=${mcNumber}&q[identifiers_is_type_eq]=MC`,
      headers: {
        'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY,
      },
    }));

    const [emailResponse, ...otherResponses] = await Promise.all([
      axios.request(config1),
      ...dotConfigs.map(config => axios.request(config)),
      ...mcConfigs.map(config => axios.request(config)),
    ]);

    const dotResponses = otherResponses.slice(0, dotConfigs.length);
    const mcResponses = otherResponses.slice(dotConfigs.length);

    const combinedData = {
      emailSearch: emailResponse.data,
      dotSearch: dotResponses.map(res => res.data),
      mcSearch: mcResponses.map(res => res.data),
    };

    res.status(200).json(combinedData);

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data from Highway API' });
  }
});

app.post("/carriers", async (req, res) => {
  const { email } = req.body;
  // console.log("Received email:", email);

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://servicestruckload.stgextrlc.net/ws/carriers/search?id=VOLRAK',
    headers: { 
      'Accept': 'application/json', 
      'X-com.mcleodsoftware.CompanyID': 'TMS', 
      'Authorization': 'Token ' + process.env.MCLEODSTAGINGTOKEN
    },
  };

  try {
    const response = await axios.request(config);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while processing the request" });
  }
});


function searchMCNumbers(body) {
  const regex = /MC\d+/g;

  const matches = body.match(regex);

  return matches || [];
}

function searchDOTNumbers(body) {
  const regex = /DOT\d+/g;

  const matches = body.match(regex);
  
  return matches || [];
}
 function getNumbers(data) {
  try {
      let mcNums = [];
      let dotNums = [];
      mcNums.push(...searchMCNumbers(data));
      dotNums.push(...searchDOTNumbers(data));
      return { mc: mcNums, dot: dotNums };
  } catch (error) {
      console.error(error);
      return { error: "Failed to retrieve numbers", details: error.message };
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
