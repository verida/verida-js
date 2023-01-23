
export interface ISchema {
    getSpecification(): Promise<any>

    validate(data: any): Promise<boolean>

    getSchemaJson(): Promise<object>

    getAppearance(): Promise<any>
}