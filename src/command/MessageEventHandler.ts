import { Message } from "discord.js";



export abstract class MessageEventHandler<S> {

    private handlers: Handlers<S> = {
        pre: [],
        post: [],
        non: []
    };

    public on<T extends keyof Handlers<S>>(eventType: T, callback: Handlers<S>[T][number]) {
        this.handlers[eventType].push(callback);
    }

    public removeListener<T extends keyof Handlers<S>>(eventType: T, callback: Handlers<S>[T][number]) {
        this.handlers[eventType].splice(this.handlers[eventType].indexOf(callback), 1);
    }

    async trigger(eventType: keyof Handlers<S>, message: Message, session: S) {
        for (let handler of this.handlers[eventType]) {
            if (!(await handler(message, session)))
                return false;
        }
        return true;
    }
}
type MessageHandler<S> = (message: Message, session: S) => Promise<boolean>;
type Handlers<S> = {
    pre: MessageHandler<S>[];
    post: MessageHandler<S>[];
    non: MessageHandler<S>[];
};
