export class Logger {
    static log(...data: any[]) {
        if (import.meta.env.ENV != 'DEVELOPMENT') {
            console.log(data);
        }
    }

    static error(...data: any[]) {
        if (import.meta.env.ENV != 'DEVELOPMENT') {
            console.error(data);
        }
    }

    static warn(...data: any[]) {
        if (import.meta.env.ENV != 'DEVELOPMENT') {
            console.warn(data);
        }
    }
}