module.exports = (client, aliases, callback) => {
  if (typeof aliases === 'string') {
    aliases = [aliases]
  }

  client.on('message', (message) => {
    const { content } = message
    const args = message.content.slice(1).trim().split(/ +/g);

    aliases.forEach((alias) => {
      const command = `!${alias}`

      if (content.startsWith(`${command} `) || content === command) {
        console.log(`${message.author.username} runned the command ${command} on ${message.guild.name}`)
        callback(message, args)
      }
    })
  })
}