import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from "./sequelize";


export interface UserAttributes {
    id: string;
    initTime: number;
    concludeTime: number;
    waitDuration: number;
    windowDuration: number;
    cooldownDuration: number;
    minRcCount: number;
}

export interface UserCreationAttributes extends Optional<UserAttributes, "id"> { }

export const User = sequelize.define<Model<UserAttributes, UserCreationAttributes>, {}>("user", {
    id: {
        "type": DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    initTime: {
        "type": DataTypes.NUMBER
    },
    concludeTime: {
        "type": DataTypes.NUMBER
    },
    waitDuration: {
        "type": DataTypes.NUMBER
    },
    windowDuration: {
        "type": DataTypes.NUMBER
    },
    cooldownDuration: {
        "type": DataTypes.NUMBER
    },
    minRcCount: {
        "type": DataTypes.NUMBER
    }
});
