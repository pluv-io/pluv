export const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
    if (a.length !== b.length) return false; // Lengths are different

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i]; // XOR each byte
    }

    return result === 0; // If all bytes are equal, result will be 0
};
