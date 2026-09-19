export const inRange = (value: number, range: { max: number; min: number }): boolean => {
    const { max, min } = range;

    return Number.isInteger(value) && value >= min && value <= max;
};
