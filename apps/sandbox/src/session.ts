const USER_ID_KEY = "pluv-sandbox-user-id";
const NAME_KEY = "pluv-sandbox-name";

export const readUserId = (): string => {
    const existing = sessionStorage.getItem(USER_ID_KEY);

    if (existing) return existing;

    const id = crypto.randomUUID();
    sessionStorage.setItem(USER_ID_KEY, id);

    return id;
};

export const readName = (): string => sessionStorage.getItem(NAME_KEY) || "Guest";

export const writeName = (name: string): void => {
    sessionStorage.setItem(NAME_KEY, name);
};
