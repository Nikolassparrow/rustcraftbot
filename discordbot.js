const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

const config = require("./config");

class DiscordBot extends Discord.Client {
    constructor(props) {
        super(props);

        this.commands = new Discord.Collection();

        this.loadDiscordCommands();
        this.loadDiscordEvents();
    }

    loadDiscordCommands() {
        const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'commands'))
            .filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            this.commands.set(command.name, command);
        }
    }

    loadDiscordEvents() {
        const eventFiles = fs.readdirSync(path.join(__dirname, '..', 'discordEvents'))
            .filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`../discordEvents/${file}`);

            if (event.name === 'rateLimited') {
                this.rest.on(event.name, (...args) => event.execute(this, ...args));
            }
            else if (event.once) {
                this.once(event.name, (...args) => event.execute(this, ...args));
            }
            else {
                this.on(event.name, (...args) => event.execute(this, ...args));
            }
        }
    }

    build() {
        this.login(config.token).catch(e => {
            console.log(`${e}: error logging into discord bot`);
        });
    }

    async setupCommands(guild) {
        await require('./registerdiscordcommands')(this, guild);
    }

}