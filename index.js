require('dotenv').config();
const Discord = require("discord.js");
const shop = require('./commands/shop');
const webhook = require('./utils/webhook');
const axios = require("axios");
const Sentry = require("@sentry/node");

const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
require('discord-buttons')(client); 

var jwt;

Sentry.init({
  dsn: "https://a2a6105df7bc4c488446a5ea7cc19908@o875884.ingest.sentry.io/5846296",
  tracesSampleRate: 1.0,
});


client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
    console.log('\n-----ACTIVE SERVERS-----');
    var count = 0;
    client.guilds.cache.forEach(guild => {
        console.log(`${guild.name} | ${guild.id}`);
        count ++
      })
      client.user.setPresence({
        activity: {
            name: 'on '+count+ ' servers',
            type: 0
        }
        });
    console.log('-------TOTAL: '+count+'-------');
  axios
  .post('https://api.octorole.xyz/auth/local', {
    identifier: process.env.STRAPI_USER,
    password: process.env.STRAPI_PWD,
  })
  .then(response => {
    shop(client, response.data.jwt);
    webhook(client, response.data.jwt);
    jwt = response.data.jwt;
  })
})

setInterval(async function() {
  var server = 0;
  var member = 0
    await client.guilds.cache.forEach(guild => {
        server++;
        member = member + guild.memberCount;
      })
        await axios.put('https://api.octorole.xyz/data/1',{
                            members: member,
                            servers: server
                        }, {
                            headers: {
                            "Authorization": "Bearer "+jwt,
                        }}).then(()=>{console.log("Data updated: "+member+" members on "+server+ " servers.")})
}, 3600 * 1000);

client.login(process.env.TOKEN)