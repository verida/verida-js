
export default class ContextNotFoundError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ContextNotFoundError"
    }
}