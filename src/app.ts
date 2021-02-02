import { Client } from "discord.js";
import { CommandHandler } from "./command/CommandHandler";
import { FileManager } from "./config";
import { User, UserAttributes } from "./data/User";
import { RCSession } from "./session/RCSession";


const defaultConfig: Config = {
    discordBotToken: ""
};

const configFilename = "config.json";


type Config = {
    discordBotToken: string
}
async function start() {

    let configManager = new FileManager<Config>(configFilename, defaultConfig, true);
    let config = await configManager.get();
    let client = new Client();
    await client.login(config.discordBotToken);
    console.log("Discord Bot Invite URL: " + await client.generateInvite())

    await User.sync();


    let commandHandler = await CommandHandler.load(
        client,
        "This bot lets you do stuff",
        User,
        {
            initTime: new Date().setHours(8, 0, 0, 0),
            concludeTime: new Date().setHours(22, 0, 0, 0),
            waitDuration: 5 * 60 * 1000,
            windowDuration: 60 * 60 * 1000,
            cooldownDuration: 10 * 60 * 1000,
            minRcCount: 2
        },
        RCSession
    );

    commandHandler.registerCommand(<const>{
        name: "rc",
        description: "Call this to perform a reality check",
        args: [
        ]
    }, async (args, session, msg) => {
        await msg.channel.send(session.realityCheck());
    });

    commandHandler.registerCommand(<const>{
        name: "setstart",
        description: "Sets the initiation time (using HH:mm)",
        args: [
            {
                name: "start_time",
                description: "The time to start doing reality checks each day, in HH:mm format",
                optional: false,
                type: "string"
            }
        ]
    }, async (args, session, msg) => {
        await session.updateOnlineTimes("HH:mm", args["start_time"]);
    });

    commandHandler.registerCommand(<const>{
        name: "setend",
        description: "Sets the conclusion time (using HH:mm)",
        args: [
            {
                name: "stop_time",
                description: "The time to stop doing reality checks each day, in HH:mm format",
                optional: false,
                type: "string"
            }
        ]
    }, async (args, session, msg) => {
        await session.updateOnlineTimes("HH:mm", undefined, args["stop_time"]);
    });

    commandHandler.registerCommand(<const>{
        name: "setrccount",
        description: "Sets the minimum reality check count",
        args: [
            {
                name: "count",
                description: "Minimum reality check count",
                optional: false,
                type: "number"
            }
        ]
    }, async (args, session, msg) => {
        await session.updateBehaviorSetting("minRcCount", args.count);
    });

    commandHandler.registerCommand(<const>{
        name: "setwait",
        description: "Sets the wait duration, in minutes",
        args: [
            {
                name: "duration",
                description: "Wait duration in minutes",
                optional: false,
                type: "number"
            }
        ]
    }, async (args, session, msg) => {
        await session.updateBehaviorSetting("waitDuration", args.duration);
    });

    commandHandler.registerCommand(<const>{
        name: "setwindow",
        description: "Sets the window duration, in minutes",
        args: [
            {
                name: "duration",
                description: "Window duration in minutes",
                optional: false,
                type: "number"
            }
        ]
    }, async (args, session, msg) => {
        await session.updateBehaviorSetting("windowDuration", args.duration);
    });

    commandHandler.registerCommand(<const>{
        name: "setcooldown",
        description: "Sets the cooldown duration, in minutes",
        args: [
            {
                name: "duration",
                description: "Cooldown duration in minutes",
                optional: false,
                type: "number"
            }
        ]
    }, async (args, session, msg) => {
        await session.updateBehaviorSetting("cooldownDuration", args.duration);
    });

    commandHandler.on("non", async (message, session) => {
        message.channel.send("Sorry, I don't understand. Try using `!help`");
        return true;
    });


}

start().catch(console.error);