const Discord = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        await client.user.setUsername(config.username);

        client.user.setPresence({
            activities: [{ name: 'crafting', type: Discord.ActivityType.Streaming }],
            status: 'online' 
        });

        const guild = client.guilds.cache.get();

        await client.setupCommands(guild);
    }
}