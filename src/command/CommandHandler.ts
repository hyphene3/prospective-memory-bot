import { Client, Message, Snowflake, User } from "discord.js";
import { InvalidMessageFormatError } from "./InvalidMessageFormatError";
import { getInvalidUsageMessage } from "./getInvalidUsageMessage";
import { getSignature } from "./getSignature";
import { CommandsConfig, ArgsPayload, CommandConfig, ArgsConfig, ArgConfig, CommandCallback } from "./ArgConfig";
import { MessageEventHandler } from "./MessageEventHandler";
import { NoID, SessionManager } from "../session/SessionManager";
import { Session, SessionTModelAttributes } from "../session/Session";
import { Model, ModelCtor } from "sequelize/types";


export class CommandHandler<T extends SessionTModelAttributes, S extends Session<T>> extends MessageEventHandler<S>{
    private commands: CommandsConfig<S>;

    private constructor(
        private client: Client,
        private helpMessage: string,
        protected sessionManager: SessionManager<T, S>) {

        super();
        this.commands = {};

        this.client.on('message', this.onMessage.bind(this));
        this.registerCommand(<const>{
            name: "help",
            args: [{
                "name": "command_name",
                optional: true,
                type: "string",
                description: "Name of the command to show help for"
            }],
            description: "Provides help information for commands"
        }, this.handleHelp.bind(this));
    }

    public static async load<T extends SessionTModelAttributes, S extends Session<T>>(
        client: Client,
        helpMessage: string,
        modelController: ModelCtor<Model<T,any>>,
        defaultData: NoID<T>,
        SessionClass: new (user: User, data: Model<T,T>)=>S) {

        let sessionManager = await SessionManager.load(client, modelController, defaultData, SessionClass);

        return new CommandHandler(client, helpMessage, sessionManager);
    }

    private async handleHelp(payload: { command_name: string }, session: S, message: Message) {
        let commandName = payload.command_name;
        if (commandName) {
            commandName = commandName.toLowerCase();
            if (commandName.startsWith("!"))
                commandName = commandName.substring(1);
            if ((commandName in this.commands)) {
                let commandConfig = this.commands[commandName].config;
                let response = `\`${getSignature(commandConfig)}\`\n${commandConfig.description}\n`;
                for (let arg of commandConfig.args) {
                    response += `\n\`${arg.name}\`: (${arg.optional ? "optional" : "required"}, ${arg.type}) ${arg.description}`;
                }
                await message.channel.send(response);
                return;
            } else {
                await message.channel.send("Command not found");
                return;
            }

        } else {
            let response = `${this.helpMessage}`;
            for (let name in this.commands) {
                let commandConfig = this.commands[name].config;
                response += `\n\`${getSignature(commandConfig)}\`: ${commandConfig.description}`;
            }
            await message.channel.send(response);
            return;
        }
    }

    private parseCommand(command: string): { commandMetadata: CommandsConfig<S>[string], args: string[] } | null {
        if (!command.startsWith("!")) {
            return null;
        }

        command = command.substring(1);
        let args = command.split(" ");
        let commandName = args.shift()?.toLowerCase();

        if (!commandName || !(commandName in this.commands)) {
            return null;
        }

        return {
            commandMetadata: this.commands[commandName],
            args
        };

    }

    private async onMessage(message: Message) {
        if (!message.author.bot) {
            let session = await this.sessionManager.fetch(message.author);

            if (!(await this.trigger('pre', message, session)))
                return;

            let parsedCommand = this.parseCommand(message.cleanContent);

            if (parsedCommand) {
                let { commandMetadata, args } = parsedCommand;
                try {
                    let argsPayload = commandMetadata.config.args.map((argConfig, i) => {
                        if (i >= args.length) {
                            if (argConfig.optional) {
                                return {
                                    name: argConfig.name,
                                    value: undefined
                                };
                            } else {
                                throw new InvalidMessageFormatError();
                            }
                        }
                        let argument = args[i];
                        if (argConfig.type == "number") {
                            let num = Number(argument);
                            if (isNaN(num))
                                throw new InvalidMessageFormatError();
                            return {
                                name: argConfig.name,
                                value: num
                            };
                        }
                        return {
                            name: argConfig.name,
                            value: args.slice(i).join(" ")
                        };

                    }).reduce((previousValue, currentValue) => {
                        previousValue[currentValue.name] = currentValue.value;
                        return previousValue;
                    }, {} as any) as ArgsPayload<any>;

                    await commandMetadata.callback(argsPayload, session, message);

                    await this.trigger('post', message, session);
                } catch (error) {
                    if (error instanceof InvalidMessageFormatError) {
                        await message.channel.send(getInvalidUsageMessage(commandMetadata.config));
                    }
                    else
                        await message.channel.send("❌ " + error.toString());
                }
            } else {
                if (!(await this.trigger('non', message, session)))
                    return;
            }
        }
    }

    public registerCommand<T extends ArgsConfig>(config: CommandConfig<T>, callback: CommandCallback<T, S>) {
        // validation
        let numOptional = 0;
        let numStrings = 0;
        for (let argument of config.args) {
            if (numStrings != 0)
                throw new Error("Invalid argument configuration - if there are any strings in the command arguments, there can be only one, and it must be the last argument.");
            if (numOptional != 0 && !argument.optional)
                throw new Error("Invalid argument configuration - all optional arguments must be contiguous and at the end");

            numOptional += argument.optional ? 1 : 0;
            numStrings += argument.type == "string" ? 1 : 0;
        }
        this.commands[config.name.toLowerCase()] = { config, callback };
    }

}