const fs = require("fs");
const path = require('path');
const Rest = require('@discordjs/rest');
const Types = require('discord-api-types/v9');

const config = require('./config');

module.exports = async (client, guild) => {
    const commands = [];
    const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'commands'))
        .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        commands.push(command.getData(client, guild.id).toJSON());
    }

    const rest = new Rest.REST({ version: '9' }).setToken(config.token);

    try {
        await rest.put(Types.Routes.applicationGuildCommands(config.clientId, guild.id), { body: commands });
    } catch (e) {
        console.log(`${e}: error registering discord commands`);
        process.exit(1);
    }
}