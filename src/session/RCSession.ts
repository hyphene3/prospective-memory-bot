import { User as DC_User } from "discord.js";
import { Model } from 'sequelize';
import moment from "moment";
import { UserAttributes } from "../data/User";
import { User } from "../data/User";
import { RCData } from "./RCData";
import { CancellableEventHandler } from "../util/CancellableEventHandler";
import { CancellableEvent } from "../util/CancellableEvent";
import { Session } from "./Session";


export class RCSession extends Session<UserAttributes> implements CancellableEventHandler<RCData> {
    public constructor(user: DC_User, data: Model<UserAttributes, any>) {
        super(data, user);
        this.recalculateAlarms();
    }
    
    public async updateOnlineTimes(timeFormat: string, startTime?: string, endTime?: string) {
        if (startTime) {
            this.data.set('initTime', moment(startTime, timeFormat).valueOf());
        }
        if (endTime) {
            this.data.set('concludeTime', moment(endTime, timeFormat).valueOf());
        }
        await this.data.save();
        this.recalculateAlarms();
    }

    public async updateBehaviorSetting(type: "waitDuration" | "windowDuration" | "cooldownDuration" | "minRcCount", durationMinutesOrMinRcCount: number) {
        if (!Number.isInteger(durationMinutesOrMinRcCount) || durationMinutesOrMinRcCount <= 0) {
            if (type == "minRcCount") {
                throw new Error("Please enter the count as a positive decimal integer");
            } else {
                throw new Error("Please enter the duration (in minutes) as a positive decimal integer");
            }
        }
        if (type == "minRcCount")
            this.data.set(type, durationMinutesOrMinRcCount);
        else
            this.data.set(type, durationMinutesOrMinRcCount * 60 * 1000);
        await this.data.save();
        this.recalculateAlarms();
    }

    protected getHoursValue(dateValue: number) {
        return dateValue - new Date(dateValue).setHours(0, 0, 0, 0).valueOf();
    }

    protected isInBounds(date: Date) {
        let start = this.getHoursValue(this.data.getDataValue('initTime'));
        let end = this.getHoursValue(this.data.getDataValue('concludeTime'));
        let dv = this.getHoursValue(date.valueOf());

        if (start < end) {
            return start <= dv && dv <= end;
        } else {
            return !(end < dv && dv < start);
        }
    }

    private currentEvent: CancellableEvent<RCData> | null = null;
    private realityCheckData: {
        rcCount: number;
        lastRc: Date;
    } = {
            rcCount: 0,
            lastRc: new Date(0)
        };

    private recalculateAlarms() {
        if (this.currentEvent)
            this.currentEvent.cancel();
        this.onEvent({ type: "INIT" });
    }

    protected getNextInitTime() {
        let today = new Date();
        let start = this.getHoursValue(this.data.getDataValue('initTime'));
        let end = this.getHoursValue(this.data.getDataValue('concludeTime'));
        if (start < end) {
            return new Date(today.setHours(0, 0, 0, 0).valueOf() + start + 24 * 60 * 60 * 1000);
        } else {
            return new Date(today.setHours(0, 0, 0, 0).valueOf() + start);
        }

    }

    public onEvent(data: RCData) {
        switch (data.type) {
            case "INIT":
                this.realityCheckData = {
                    rcCount: 0,
                    lastRc: new Date(0)
                };

                let nextWindowOpen = new Date(Date.now() + this.data.getDataValue('waitDuration'));
                let nextWindowClose = new Date(Date.now() + this.data.getDataValue('waitDuration') + this.data.getDataValue('windowDuration'));
                if (this.isInBounds(nextWindowClose)) {
                    this.initiate();
                    this.currentEvent = new CancellableEvent(this, nextWindowClose, {
                        type: "WINDOW_CLOSE",
                        openTime: nextWindowOpen
                    });
                    return;
                } else {
                    this.conclude();
                    this.currentEvent = new CancellableEvent(this, this.getNextInitTime(), {
                        type: "INIT"
                    });
                    return;
                }
                break;
            case "WINDOW_CLOSE":
                this.count();
                this.onEvent({ type: "INIT" });
                break;
        }
    }


    protected async initiate() {
        let waitDurationMinutes = this.data.getDataValue("waitDuration") / 1000 / 60;
        let windowDurationMinutes = this.data.getDataValue("windowDuration") / 1000 / 60;
        let rcCount = this.data.getDataValue("minRcCount");
        await this.user.send(`Window opening in **${waitDurationMinutes} minutes**. It will be open for **${windowDurationMinutes} minutes**. Please perform at least **${rcCount} reality checks**.`);
    }

    private CONCLUDE_MESSAGES = [
        "We'll be back with more training tomorrow :3",
    ];
    protected async conclude() {
        await this.user.send("Your memory training for today is complete! " + this.CONCLUDE_MESSAGES[Math.floor(Math.random() * this.CONCLUDE_MESSAGES.length)]);
    }

    protected async count() {
        let completed = this.realityCheckData.rcCount;
        let expected = this.data.getDataValue("minRcCount");
        if (completed >= expected) {
            await this.user.send(`✅ You completed **${completed}/${expected}** reality checks -- great job!`);
        } else {
            await this.user.send(`❌ You completed **${completed}/${expected}** reality checks`);
        }
    }

    public realityCheck(): string {
        if (this.currentEvent?.data.type == "WINDOW_CLOSE" && this.currentEvent.data.openTime.valueOf() < new Date().valueOf()) {
            if (moment().diff(this.realityCheckData.lastRc) >= this.data.getDataValue("cooldownDuration")) {
                this.realityCheckData.lastRc = new Date();
                this.realityCheckData.rcCount++;

                let completed = this.realityCheckData.rcCount;
                let expected = this.data.getDataValue("minRcCount");
                return `👍 **${completed}/${expected}** reality checks completed`;
            }
            return "Good job reality checking! Please try again in a few moments after the cooldown period completes.";
        }
        return "Good job reality checking! Reality checks are not being logged right now.";

    }
}
