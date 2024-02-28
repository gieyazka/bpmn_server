export declare class WebApp {
    app: any;
    bpmnServer: any;
    constructor();
    /**
     * Create Express server.
     */
    initExpress(): void;
    initMongo(): void;
    setupExpress(): any;
    setupRoutes(): void;
}
