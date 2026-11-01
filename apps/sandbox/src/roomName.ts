const ROOM_NAME = /^[a-z0-9](?:[a-z0-9-_]*[a-z0-9])?$/i;

export const isRoomName = (room: string): boolean => ROOM_NAME.test(room);
