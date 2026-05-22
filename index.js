const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TRANSFER_CHANNEL_ID = process.env.TRANSFER_CHANNEL_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

client.on('ready', () => {
  console.log(`Bot online as ${client.user.tag}`);
});

app.post('/webhook', async (req, res) => {
  // Signature verification
  const payload = JSON.stringify(req.body);
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== req.headers['x-signature']) {
    return res.status(401).send('Invalid signature');
  }

  const body = req.body;
  const userId = body.item?.custom_fields?.['Discord User ID'];
  const amount = body.item?.quantity;
  const type = body.item?.variant?.name; // online/offline/reaction steht im Variant Namen

  if (!userId || !amount || !type) {
    return res.status(400).send('Missing fields');
  }

  try {
    const channel = await client.channels.fetch(TRANSFER_CHANNEL_ID);
    await channel.send(`!transfer ${userId} ${amount} ${type}`);
    res.status(200).send('OK');
  } catch (e) {
    console.log('Error:', e.message);
    res.status(500).send('Error');
  }
});

client.login(process.env.TOKEN);

app.listen(3000, () => console.log('Webhook server running on port 3000'));
