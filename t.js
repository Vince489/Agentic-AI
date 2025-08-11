import { Mistral } from '@mistralai/mistralai';
import 'dotenv/config';

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});

const chatResponse = await client.chat.complete({
  model: 'mistral-large-latest',
  messages: [{role: 'user', content: 'What is the best French cheese?'}],
});

console.log('Chat:', chatResponse.choices[0].message.content);