const express = require('express');
const serverless = require('serverless-http');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bodyParse = require('body-parser');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const router = express.Router();

let records = [];
app.use(bodyParse.json());

router.get('/', (req, res) => {
  res.send('App is running..');
});

router.post('/add', (req, res) => {
  res.send('New record added.');
});

router.delete('/', (req, res) => {
  res.send('Deleted existing record');
});

router.put('/', (req, res) => {
  res.send('Updating existing record');
});

router.get('/proxy-image', async (req, res) => {
    try {
        // const { url } = req.query;
        // if (!url) {
        //   return res.status(400).send('URL parameter is missing');
        // }
        // const response = await axios.get(url, { responseType: 'arraybuffer' });
        // res.set('Content-Type', response.headers['content-type']);
        res.send('new api');
      } catch (error) {
        res.status(500).send('Error fetching image');
      }
})
router.get('/demo', (req, res) => {
  res.json([
    {
      id: '001',
      name: 'Aayush',
    },
    {
      id: '002',
      name: 'rohit',
    },
    {
      id: '003',
      name: 'Mohit',
    },
  ]);
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function callChatGPT(prompt) {
    const response = await model.generateContent(prompt);
    return response.response.text();
}
router.post('/chatgpt', async (req, res) => {
    try {
        console.log('req', req.body);
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Promptttttt is required' });
        }
        const response = await callChatGPT(prompt);
        return res.status(200).json({ message: response });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});
app.use('/.netlify/functions/app', router);
module.exports.handler = serverless(app);