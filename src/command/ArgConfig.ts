import { Message } from "discord.js";
import { Union } from "ts-toolbelt";
import { Select } from "Union/Select";



export type ArgConfig = {
    name: string;
    description: string;
    type: "string" | "number";
    optional: boolean;
};

export type ArgsConfig = readonly ArgConfig[];
export type Value<T extends ArgsConfig, name extends T[any]["name"]> = Select<T[any], { name: name; }>["type"] extends "number" ? number : string;
export type ArgsPayload<T extends ArgsConfig> = {
    [Name in T[keyof T & number]["name"]]: Value<T, Name>;
};
export type CommandCallback<T extends ArgsConfig, S> = (payload: ArgsPayload<T>, session: S, message: Message)=>Promise<void>;


export type CommandConfig<T extends ArgsConfig> = Readonly<{
    description: string;
    args: T;
    name: string;
}>;

export type CommandsConfig<S> = {
    [name: string]: {config: CommandConfig<ArgsConfig>, callback: CommandCallback<any, S>};
};
