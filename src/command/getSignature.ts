import { ArgsConfig, CommandConfig } from "./ArgConfig";



export function getSignature<T extends ArgsConfig>(command: CommandConfig<T>) {
    let signature = "!" + command.name;
    for (let argConfig of command.args) {
        if (argConfig.optional)
            signature += ` [${argConfig.name}: ${argConfig.type}]`;

        else
            signature += ` <${argConfig.name}: ${argConfig.type}>`;
    }
    return signature;
}
