import { errorCode } from "../../interfaces/interfaces";
import { manageEventObject } from "../../interfaces/manageEvent.interface";
import { logger } from "../../utils/etc";

const rename: manageEventObject = {
    run: ({ io, socket, rooms }, title) => {
        if (typeof title !== "string") return;
        const room = rooms.find(i => i.ownerId === socket.id);

        if (!room) return socket.emit("event", {
            status: errorCode.manage_rename_permission_missing,
            type: "rename",
            message: "You are not allowed to rename this room."
        });

        const oldTitle = room.title;
        room.title = title;

        logger("Room renamed / " + oldTitle + " to " + room.title, "MANAGE", 1);
        io.to(room.room_number).emit("room_update", {
            status: 200,
            type: "rename",
            room
        });
    }
};

export default rename;