const Discord = require("discord.js");
const { MessageButton, MessageActionRow } = require('discord-buttons');
const express = require("express")
const bodyParser = require("body-parser")
const fetch = require("node-fetch");

const axios = require("axios");

async function updateClaim(req, jwt) {
    console.log("Processing PUT claim.");
    return await fetch('https://api.octorole.xyz/transactions/'+req.body.id, {
        method: "PUT",
        headers: {
            'Authorization': 'Bearer '+jwt, 
            'Content-Type': 'application/x-www-form-urlencoded'
          },
        body: new URLSearchParams({
            'claimed': true,
            'claimed_at': new Date()
        })
    }).then(res => {
        console.log("Success?", res.ok);
        return res.json();
    });
}

/** PARTIE PAYPAL LIVE */
const paypalToken = '';
const paypalApi = 'https://api-m.paypal.com';
const webhookId = '';

/** PARTIE PAYPAL SANDBOX */
const paypalTokenSandbox = '=';
const paypalApiSandbox = 'https://api-m.sandbox.paypal.com';
const webhookIdSandbox = '';

module.exports = (client, jwt) => { 
    const app = express()
    const PORT = 2807

    // Tell express to use body-parser's JSON parsing
    app.use(bodyParser.json())

    // Start express on the defined port
    app.listen(PORT, 'localhost', () => console.log(`🚀 Server running on port ${PORT}`))

    app.use(bodyParser.json())

    app.post("/hook", (req, res) => {
        if(req.body.key == ''){
            const list = client.guilds.cache.get(req.body.server.guildId);

        try{
                const successBuying = new Discord.MessageEmbed()
                .setColor('#c490e4')
                .setAuthor(list.members.cache.get(req.body.userId).user.username+"#"+list.members.cache.get(req.body.userId).user.discriminator+" vient d'acheter le grade "+req.body.product.name+".", 'https://i.imgur.com/6hRd4CZ.png')
                .setDescription("Vous aussi vous souhaitez ce grade ? Rendez-vous sur la boutique !")
                .setFooter('powered by octorole.xyz', 'https://i.imgur.com/f195eLa.png')
                .setTimestamp();
    
                let buySame = new MessageButton()
                .setLabel(req.body.product.name)
                .setStyle('url')
                .setEmoji(req.body.product.emoji)
                .setURL('https://octorole.xyz/product/'+req.body.product.id)

                res.status(200).end() // Responding is important
                client.guilds.cache.get(req.body.server.guildId).channels.cache.get(req.body.server.notificationChannelId).send('', {
                    buttons: buySame,
                    embed: successBuying
                })
                client.guilds.cache.get(req.body.server.guildId).members.cache.get(req.body.userId).roles.add(req.body.product.roleId);
                console.log(req.body.userId+' buy '+req.body.product.roleId+' on '+req.body.server.guildId);
                updateClaim(req, jwt);

        }catch(e){

        }
        }
    })
    app.post("/delete", (req, res) => {
        if(req.body.active == false && req.body.key == ''){
            const list = client.guilds.cache.get(req.body.server.guildId);
            list.members.cache.get(req.body.userId).roles.remove(req.body.product.roleId).catch(e =>{
                if(e == null){
                    console.log("y'a un soucis ")
                } else {
                    console.log('pas de soucis')
                }
            })
            list.members.cache.get(req.body.userId).send(":warning: Votre rôle **"+req.body.product.name+"** vient d'expirer sur "+list.name+".")
        }
        res.status(200).end() // Responding is important
    })
    app.post("/paypal", async (req, res) => {
        /* PARTIE ON VERIFIE ENSEMBLE LE WEBHOOK */
        await axios.post(`${paypalApi}/v1/notifications/verify-webhook-signature`,{
        "transmission_id": req.headers['paypal-transmission-id'],
        "transmission_time": req.headers['paypal-transmission-time'],
        "cert_url": req.headers['paypal-cert-url'],
        "auth_algo": req.headers['paypal-auth-algo'],
        "transmission_sig": req.headers['paypal-transmission-sig'],
        "webhook_id": webhookId,
        "webhook_event": req.body
        },{
            headers: {
              'Authorization': `Basic ${paypalToken}`,
              'Content-Type': 'application/json'
            }}).then(async response =>{
                if(response.data.verification_status == "SUCCESS"){
                    const referenceId = req.body.resource.purchase_units[0].reference_id;
        const productId = referenceId.split('_')[3];
        var indexGuildId;
        await axios.get(`https://api.octorole.xyz/servers?guildId=${referenceId.split('_')[0]}`,{
            headers: {
              'Authorization': `Bearer ${jwt}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }})
            .then(res => {
              indexGuildId = res.data[0].id;
            }).catch(function (error){
            })
        await axios.get(`https://api.octorole.xyz/products/info/${productId}`)
              .then(async res => {
                if(res.status === 200){
                  if(res.data.price == req.body.resource.purchase_units[0].amount.value && req.body.resource.purchase_units[0].amount.currency_code == "EUR" && req.body.resource.purchase_units[0].payee.email_address == res.data.server.paypal){
                    await axios.post(`https://api.octorole.xyz/transactions`,{
                        transactionId: req.body.resource.id,
                        userId: referenceId.split('_')[1],
                        provider: 'paypal',
                        username: referenceId.split('_')[4],
                        server: [indexGuildId],
                        product: [productId]
                      } ,{
                          headers: {
                            'Authorization': `Bearer ${jwt}`,
                          }})
                          .then(res => {
                              console.log('Transaction created for #'+req.body.resource.id)
                          }).catch(function (error){
                          })
                  } else {
                      console.log('Error: not matching product data on transaction id '+req.body.resource.id);
                  }
                }
              }).catch(function (error){
                console.log(`Error while fetching product ${productId} called by Paypal webhook: ${error}`)
              })
                }
            }).catch(e => {})
              res.status(200).end();
    })

    app.post("/paypal-sandbox", async (req, res) => {
      /* PARTIE ON VERIFIE ENSEMBLE LE WEBHOOK */
      await axios.post(`${paypalApiSandbox}/v1/notifications/verify-webhook-signature`,{
      "transmission_id": req.headers['paypal-transmission-id'],
      "transmission_time": req.headers['paypal-transmission-time'],
      "cert_url": req.headers['paypal-cert-url'],
      "auth_algo": req.headers['paypal-auth-algo'],
      "transmission_sig": req.headers['paypal-transmission-sig'],
      "webhook_id": webhookIdSandbox,
      "webhook_event": req.body
      },{
          headers: {
            'Authorization': `Basic ${paypalTokenSandbox}`,
            'Content-Type': 'application/json'
          }}).then(async response =>{
              if(response.data.verification_status == "SUCCESS"){
                  const referenceId = req.body.resource.purchase_units[0].reference_id;
      const productId = referenceId.split('_')[3];
      var indexGuildId;
      await axios.get(`https://api.octorole.xyz/servers?guildId=${referenceId.split('_')[0]}`,{
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }})
          .then(res => {
            indexGuildId = res.data[0].id;
          }).catch(function (error){
          })
      await axios.get(`https://api.octorole.xyz/products/info/${productId}`)
            .then(async res => {
              if(res.status === 200){
                if(res.data.price == req.body.resource.purchase_units[0].amount.value && req.body.resource.purchase_units[0].amount.currency_code == "EUR" && req.body.resource.purchase_units[0].payee.email_address == res.data.server.paypal){
                  await axios.post(`https://api.octorole.xyz/transactions`,{
                      transactionId: req.body.resource.id,
                      userId: referenceId.split('_')[1],
                      provider: 'paypal',
                      username: referenceId.split('_')[4],
                      server: [indexGuildId],
                      product: [productId]
                    } ,{
                        headers: {
                          'Authorization': `Bearer ${jwt}`,
                        }})
                        .then(res => {
                            console.log('Transaction created for #'+req.body.resource.id)
                        }).catch(function (error){
                        })
                } else {
                    console.log('Error: not matching product data on transaction id '+req.body.resource.id);
                }
              }
            }).catch(function (error){
              console.log(`Error while fetching product ${productId} called by Paypal webhook: ${error}`)
            })
              }
          }).catch(e => {})
            res.status(200).end();
  })
  
    
}




