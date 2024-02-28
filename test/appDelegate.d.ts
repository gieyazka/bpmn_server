import { IExecution, Item } from '..';
import { DefaultAppDelegate } from '..';
declare class MyAppDelegate extends DefaultAppDelegate {
    constructor(logger?: any);
    sendEmail(to: any, msg: any, body: any): void;
    executionStarted(execution: IExecution): Promise<void>;
    messageThrown(messageId: any, data: any, matchingQuery: any, item: Item): Promise<void>;
    signalThrown(signalId: any, data: any, matchingQuery: any, item: Item): Promise<void>;
    serviceCalled(input: any, context: any): Promise<void>;
}
export { MyAppDelegate };
