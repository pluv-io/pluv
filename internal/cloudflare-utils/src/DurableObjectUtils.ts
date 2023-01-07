export class DurableObjectUtils {
    public static isValidId(value: string): boolean {
        /**
         * !HACK
         * @description Each Durable Object has a 256-bit unique ID. IDs can be
         * derived from string names, or chosen randomly by the system.
         * @author David Lee
         * @date August 8, 2022
         */
        return /^[0-9a-f]{64}$/.test(value);
    }

    public static isValidName(value: string): boolean {
        return value.length <= 32;
    }
}
