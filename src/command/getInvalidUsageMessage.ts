import { ArgsConfig, CommandConfig } from "./ArgConfig";
import { getSignature } from "./getSignature";



export function getInvalidUsageMessage<T extends ArgsConfig>(command: CommandConfig<T>) {
    return `USAGE: \`${getSignature(command)}\`\n*Use \`!help ${command.name}\` for more info*`;
}
