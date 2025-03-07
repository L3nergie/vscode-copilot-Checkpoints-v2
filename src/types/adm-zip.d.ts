declare module 'adm-zip' {
    class AdmZip {
        addFile(arg0: string, arg1: Buffer<ArrayBuffer>) {
            throw new Error('Method not implemented.');
        }
        addLocalFolder(sourceDir: string, arg1: string, arg2: (entryPath: string) => boolean) {
            throw new Error('Method not implemented.');
        }
        constructor();
        addLocalFile(filePath: string, zipPath?: string): void;
        writeZip(filePath: string): void;
    }
    export = AdmZip;
}