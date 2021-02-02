import { User as DC_User } from "discord.js";
import { Model } from 'sequelize';

export type SessionTModelAttributes = {
    id: string
};
export class Session<T extends SessionTModelAttributes> {
    protected readonly data: Model<T>;
    protected readonly user: DC_User;

    public constructor(data: Model<T, any>, user: DC_User) {
        this.data = data;
        this.user = user;
    }

}
