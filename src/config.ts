import { readFileSync, writeFileSync, existsSync } from 'fs';
import { writeFile } from 'fs/promises';

export class FileManager<Schema> {
    private contents: Schema;
    private filename: string;

    constructor(filename: string, defaultContents: Schema, errorIfFileDNE: boolean) {
        this.filename = filename;
        if (existsSync(filename)) {
            this.contents = JSON.parse(readFileSync(filename).toString()) as unknown as Schema;
        } else {
            console.error(`${filename} Doesn't exist. Creating it...`);
            writeFileSync(filename, JSON.stringify(defaultContents, null, 2));
            if(errorIfFileDNE)
                throw new Error();
            this.contents = defaultContents;
        }
    }

    public get() {
        return this.contents;
    }

    public async update(config: Schema) {
        this.contents = config;
        await writeFile(this.filename, JSON.stringify(config, null, 2));
    }
}




