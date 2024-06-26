import { commonEventObject } from "../../interfaces/common.interface";
import { errorCode } from "../../interfaces/interfaces";
import { logger } from "../../utils/etc";

const notice: commonEventObject = {
    run: ({ socket, members, rooms }) => {
        const memberData = members.find(i => i.id === socket.id);
        const room = rooms.find(i => i.room_number === memberData?.room_number);

        if (!room) {
            socket.emit("error", {
                type: "log",
                message: "You must joined owner of specified room",
                status: errorCode.common_log_member_room_not_found
            });
            return;
        };

        logger(socket.id + " requested logs");
        socket.emit("common_log_response", {
            status: 200,
            logs: room.logs
        });
    }
};

export default notice;