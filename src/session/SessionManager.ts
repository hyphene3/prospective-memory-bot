import { Client, User } from "discord.js";
import { Exclude } from "Object/Exclude";
import { ExcludeKeys } from "Object/ExcludeKeys";
import { Model, ModelCtor } from "sequelize/types";
import { AsyncLockMap } from "../util/AsyncLockMap";
import { Session, SessionTModelAttributes } from "./Session";

export type NoID<T extends SessionTModelAttributes> = Exclude<T, {id: string}>;
export class SessionManager<T extends SessionTModelAttributes, S extends Session<T>> {

    private locker: AsyncLockMap = new AsyncLockMap();

    protected constructor(
        private readonly client: Client,
        private readonly modelController:ModelCtor<Model<T>>,
        private readonly defaultData: NoID<T>,
        private readonly sessions: { [id: string]: S; },
        private readonly SessionClass: new (user: User, data: Model<T,T>)=>S) {
    }

    public static async load<T extends SessionTModelAttributes, S extends Session<T>>(
        client: Client,
        modelController:ModelCtor<Model<T>>,
        defaultData:NoID<T>,
        SessionClass: new (user: User, data: Model<T,T>)=>S): Promise<SessionManager<T,S>> {

        let data = (await modelController.findAll({
            where: {}
        }));

        let discordUsers = await Promise.all(data.map(x => client.users.fetch(x.getDataValue('id'))));

        let sessionsMap: { [id: string]: S; } = {};
        data.forEach((data, i) => {
            sessionsMap[data.get().id] = new SessionClass(discordUsers[i], data);
        });

        return new SessionManager(client, modelController, defaultData, sessionsMap, SessionClass);
    }


    public async fetch(user: User): Promise<S> {
        await this.locker.acquire(user.id);
        if (user.id in this.sessions) {
            this.locker.releaseAll(user.id);
            return this.sessions[user.id];
        } else {
            let [data, _] = await this.modelController.findOrCreate({
                where: {
                    id: user.id
                },
                defaults: {...this.defaultData, id: user.id} as any as T
            });
            let userSession = new this.SessionClass(user, data);
            this.sessions[user.id] = userSession;
            this.locker.releaseAll(user.id);
            return userSession;
        }
    }

}
