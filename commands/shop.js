const command = require("../utils/command");
const fetch = require('node-fetch');
const Discord = require("discord.js");
const axios = require('axios');
const { MessageButton, MessageActionRow } = require('discord-buttons'); // To require only certain extensions that actually do the work!

module.exports = (client, jwt) => {
    command(client, 'shop', async(message, args) => {

            if(args[1] == "claim") {
                //Fetch l'api
            const res = await fetch('https://api.octorole.xyz/transactions?userId='+message.author.id+'&server.guildId='+message.guild.id, { 
                method: 'GET', 
                headers: {
                  'Authorization': 'Bearer '+jwt, 
                  'Content-Type': 'application/json'
                }});
            console.log('Status Code:', res.status+' on https://api.octorole.xyz/products?server.guildId='+message.guild.id+'&highlight=true');
        
            const transactions = await res.json();

            message.delete();

            var state = false
            for(let i = 0;i<transactions.length;i++){
                if(transactions[i].claimed != true){
                    state = true;
                    message.channel.send(':white_check_mark: Votre rôle **'+transactions[i].product.name+'** vient de vous être ajouté.').then(msg =>{
                        msg.delete({timeout:5000})
                    });
                    await fetch('https://api.octorole.xyz/transactions/'+transactions[i].id,{
                        method: 'PUT', 
                        headers: {
                          'Authorization': 'Bearer '+jwt, 
                          'Content-Type': 'application/x-www-form-urlencoded'
                        },
                    body: new URLSearchParams({
                        'claimed': true,
                        'claimed_at': new Date()
                    })                
                }).then(res => {
                        message.channel.guild.members.cache.get(transactions[i].userId).roles.add(transactions[i].product.roleId);
                    })
                } 
            }
            if(state == false){
                message.channel.send(":no_entry_sign: Vous n'avez aucun rôle en attente d'être récupéré.").then(msg =>{
                    msg.delete({timeout:5000})
                })
            }
            }
            if(args[1] != "claim" && args[1] != "history" && args[1] != "info" && args[1] != "help" && args[1] != "channel"){
                //Fetch l'api
            const res = await fetch('https://api.octorole.xyz/products?server.guildId='+message.guild.id+'&highlight=true',
            {
                method: 'GET', 
                headers: {
                  'Authorization': 'Bearer '+jwt, 
                  'Content-Type': 'application/json'
                }}
            );
            console.log('Status Code:', res.status+' on https://api.octorole.xyz/products?server.guildId='+message.guild.id+'&highlight=true');
console.log(jwt);        
            const products = await res.json();

            message.delete();
            
            var state = false;

            if(products.length >=1){
                state = true;
            }

            //Embed
            let website = new MessageButton()
            .setLabel("Boutique en ligne")
            .setStyle("url")
            .setURL("https://octorole.xyz/shop/"+message.guild.id)
            .setEmoji("🛒")

            let activateServer = new MessageButton()
            .setLabel('Ajouter des produits')
            .setStyle('url')
            .setEmoji('🏷')
            .setURL('https://octorole.xyz/dashboard/products')

            const errorEmbed = new Discord.MessageEmbed()
	        .setColor('#e31740')
	        .setAuthor("Aucun produit n'a été ajouté au serveur.", 'https://i.imgur.com/FHdgBkJ.png')
            .setDescription("Besoin d'aide ? Tapez `!shop help`")
	        .setFooter('powered by octorole.xyz', 'https://i.imgur.com/f195eLa.png');

            var fields = [];
            var buttons = [];
        
            for(let i = 0;i<products.length;i++){
                fields.push({name: products[i].name, value: products[i].description, inline: true },
                { name: 'Prix:', value: products[i].price+'€ / '+products[i].type, inline: true },
                { name: '\u200b', value: '\u200b', inline: true });
                buttons.push(new MessageButton()
                .setLabel(products[i].name)
                .setStyle("url")
                .setEmoji(products[i].emoji)
                .setURL("https://octorole.xyz/product/"+products[i].id))
            }
            fields.push({name:"\u200b", value: "\u200b"})
            fields.push({name:"Besoin d'aide ?", value: "Tapez `!shop help`"})
            buttons.push(website);

            const successEmbed = new Discord.MessageEmbed()
	        .setColor('#0e9909')
            .setTitle('Grades mis en avant')
            .setDescription('Pour voir toutes les offres du serveur, rendez-vous sur la boutique.\n━━━━━')
	        .setAuthor("Bienvenue sur la boutique de "+message.guild.name, message.guild.iconURL())
            .addFields(
                fields
            )
            .setFooter('powered by octorole.xyz', 'https://i.imgur.com/f195eLa.png');


            //Partie envoie des messages
            if(state == false){
                message.channel.send('', {
                    component: activateServer,
                    embed: errorEmbed
                }).then(msg => {
                    msg.delete({timeout: 6000})
                });
            } else {
                message.channel.send('', {
                    buttons: buttons,
                    embed: successEmbed
                }).then(msg =>{
                    msg.delete({timeout:15000})
                })
                
            }     
            }
            if(args[1] == "history") {
                //Fetch l'api
            const res = await fetch('https://api.octorole.xyz/transactions?userId='+message.author.id+'&server.guildId='+message.guild.id,
            {
                method: 'GET', 
                headers: {
                  'Authorization': 'Bearer '+jwt, 
                  'Content-Type': 'application/json'
                }}
            );
            console.log('Status Code:', res.status+' on https://api.octorole.xyz/transactions?userId='+message.author.id+'&server.guildId='+message.guild.id);
        
            const transactions = await res.json();

            message.delete();

            var fields = [];

            for(let i = 0;i<transactions.length;i++){
                if(transactions[i].claimed != true){
                    fields.push({name: transactions[i].product.name, value: 'Acheté le `'+new Date(transactions[i].created_at)+'`\n:no_entry_sign: Rôle en attente de récupération. Tapez `!shop claim`.', inline: false })
                } else {
                    fields.push({name: transactions[i].product.name, value: 'Acheté le `'+new Date(transactions[i].created_at)+'`\n:white_check_mark: Rôle récupéré le `'+transactions[i].claimed_at+'`', inline: false })
                }
            }
            if(transactions.length == 0){
                fields.push({name: "Vous n'avez fait aucun achat.", value: "Tapez `!shop` pour voir la boutique de votre serveur.", inline: false })
            }

            const historyEmbed = new Discord.MessageEmbed()
	        .setColor('#0e9909')
	        .setAuthor("Historique de vos achats sur la boutique de "+message.guild.name, message.author.avatarURL())
            .addFields(
                fields
            )
            .setFooter('powered by octorole.xyz', 'https://i.imgur.com/f195eLa.png');

            message.channel.send(historyEmbed).then(msg =>{
                msg.delete({timeout:10000})
            })
            }
            if(args[1] == "info") {
                //Fetch l'api
            const res = await fetch('https://api.octorole.xyz/transactions?userId='+message.author.id+'&server.guildId='+message.guild.id+'&active=true',
            {
                method: 'GET', 
                headers: {
                  'Authorization': 'Bearer '+jwt, 
                  'Content-Type': 'application/json'
                }}
            );
            console.log('Status Code:', res.status+' on https://api.octorole.xyz/transactions?userId='+message.author.id+'&server.guildId='+message.guild.id+'&active=true');
        
            const transactions = await res.json();  
            message.delete();

            var fields = [];

            for(let i = 0;i<transactions.length;i++){
                var Difference_In_Time = new Date(transactions[i].expire_at).getTime() - new Date().getTime();
                var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
                fields.push({name: transactions[i].product.name, value: 'Expire dans `'+Math.round(Difference_In_Days)+' jours`.', inline: false })
            }
            if(transactions.length == 0){
                fields.push({name: "Vous n'avez aucun rôle actif.", value: "Tapez `!shop` pour voir la boutique de votre serveur.", inline: false })
            }

            const historyEmbed = new Discord.MessageEmbed()
	        .setColor('#c490e4')
	        .setAuthor("Achat actif sur "+message.guild.name, message.author.avatarURL())
            .addFields(
                fields
            )
            .setFooter('powered by octorole.xyz', 'https://i.imgur.com/f195eLa.png');

            message.channel.send(historyEmbed).then(msg =>{
                msg.delete({timeout:5000})
            })
            }
            if(args[1] == "help") {
            message.delete();

            const historyEmbed = new Discord.MessageEmbed()
	        .setColor('#c490e4')
	        .setAuthor("Achat actif sur "+message.guild.name, message.author.avatarURL())
            .addFields(
                {name: '`!shop`' , value: 'Affiche les informations sur la boutique de votre serveur.'},
                {name: '`!shop claim`' , value: 'Permet de récupérer vos achats.'},
                {name: '`!shop history`' , value: "Affiche l'historique de vos achats."},
                {name: '`!shop info`' , value: "Affiche vos achats actifs sur le serveur."}
            )
            .setFooter('powered by octorole.xyz', 'https://i.imgur.com/f195eLa.png');

            message.channel.send(historyEmbed).then(msg =>{
                msg.delete({timeout:10000})
            })
            }
            if(args[1] == "channel" && message.member.hasPermission('ADMINISTRATOR')) {
                if(args[2] == "set"){
                    message.delete();
                    const channelId = message.channel.id;
                    await axios
                    .get('https://api.octorole.xyz/servers?guildId='+message.channel.guild.id, {
                        headers: {
                        "Authorization": "Bearer "+jwt,
                        "Content-Type": "application/x-www-form-urlencoded"
                    }}).then(async res=> {
                        await axios
                        .put('https://api.octorole.xyz/servers/'+res.data[0].id,{
                            notificationChannelId: `${channelId}`
                        }, {
                            headers: {
                            "Authorization": "Bearer "+jwt,
                        }})});
    
                message.channel.send(":white_check_mark: Ce canal a été défini pour recevoir les nouveaux achats !").then(msg =>{
                    msg.delete({timeout:3000})
                })
                }
              
                    if(args[2] == "remove"){
                        message.delete();

                        await axios
                    .get('https://api.octorole.xyz/servers?guildId='+message.channel.guild.id, {
                        headers: {
                        "Authorization": "Bearer "+jwt,
                        "Content-Type": "application/x-www-form-urlencoded"
                    }}).then(async res=> {
                        await axios
                        .put('https://api.octorole.xyz/servers/'+res.data[0].id,{
                            notificationChannelId: `0`
                        }, {
                            headers: {
                            "Authorization": "Bearer "+jwt,
                        }})});
                  
    
                message.channel.send(":white_check_mark: Le système d'annonce des nouvelles transactions a été désactivé !").then(msg =>{
                    msg.delete({timeout:3000})
                })
                    }
                }
                
          });
}