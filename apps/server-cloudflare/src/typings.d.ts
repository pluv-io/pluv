declare interface Env {
    DEPLOY_ENV: "development" | "production";
    rooms: DurableObjectNamespace;
}
