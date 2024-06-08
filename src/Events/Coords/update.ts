import { Socket } from "socket.io";
import { coordEventObject } from "../../interfaces/coordEvent.interface";
import { boundaryType, errorCode, roomsInterface, socketMemberType } from "../../interfaces/interfaces";
import { logger } from "../../utils/etc";
import { logType } from "../../interfaces/common.interface";

function haversineDistance({boundary, socket, room, member, owner}: {
    boundary: boundaryType,
    socket: Socket,
    room: roomsInterface,
    member: socketMemberType,
    owner: socketMemberType
}, lat2: number, lon2: number) {
    // This feature was helped by GPT 3.5
    if (!boundary.x || !boundary.y) return -1;
    const toRadians = (degree: number) => degree * (Math.PI / 180);
    const R = 6371; // 지구의 반지름 (킬로미터 단위)
    const dLat = toRadians(lat2 - boundary.x);
    const dLon = toRadians(lon2 - boundary.y);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(boundary.x)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = Number((R * c * 1000).toFixed(2)); // 킬로미터 단위의 거리

    var distance_status = 0
    if (distance > (boundary.limit! / 2)) {
        distance_status = 2;
    } else if (distance > (boundary.safety! / 2)) {
        distance_status = 1;
    };

    if (distance_status !== 0) {
        socket.emit("event", {
            status: 200,
            type: "warning",
            distance_status
        });
        room.logs.push({
            type: logType.warning,
            from: member.user_tel,
            to: owner.user_name,
            message: distance_status,
            created_at: new Date()
        });
        logger("Member is now out of room's boundary / status: " + distance_status + " / dis: " + distance, "MANAGE", -1);
    };
    return distance;
};

const coordsUpdate: coordEventObject = {
    run: ({ socket, rooms, members }, coords) => {
        const memberData = members.find(i => i.id === socket.id);
        const room = rooms.find(i => i.room_number === memberData?.room_number);
        const roomMembers = members.filter(i => i.room_number == memberData?.room_number);
        const ownerMember = roomMembers?.find(i => i.id == room?.ownerId)!;

        if (!memberData) return socket.emit("error", {
            type: "coords_update",
            status: errorCode.coords_update_member_not_found,
            message: "Couldn't find member with id " + socket.id
        });

        if (!room) return socket.emit("error", {
            type: "coords_update",
            status: errorCode.coords_update_member_room_not_found,
            message: "Couldn't find room for member : " + socket.id
        });
        memberData.x = coords.x;
        memberData.y = coords.y;
        logger(`member: ${memberData.user_name} | ${memberData.user_tel} / x: ${memberData.x} / y: ${memberData.y}`, "COORDS UPDATE", 1);

        if (memberData?.id === ownerMember.id) {
            const distance = haversineDistance({
                boundary: room.boundary,
                socket,
                room,
                member: memberData,
                owner: ownerMember
            }, 
            ownerMember.x!, ownerMember.y!);
            const roomMembersData = roomMembers.filter(i => i.id !== ownerMember.id).map(({ user_name, user_tel, x, y }) => {
                return {
                    user_name,
                    user_tel,
                    x,
                    y,
                    distance: distance
                };
            });
            socket.emit("coords_update_response", {
                status: 200,
                data: roomMembersData.filter(i => i.x && i.y)
            });
        } else {
            const distance = haversineDistance({
                boundary: room.boundary,
                socket,
                room,
                member: memberData,
                owner: ownerMember
            }, ownerMember.x!, ownerMember.y!);
            socket.emit("coords_update_response", {
                status: 200,
                data: [{
                    user_name: ownerMember.user_name,
                    user_tel: ownerMember.user_tel,
                    x: ownerMember.x,
                    y: ownerMember.y,
                    distance
                }]
            });
        };
    }
};

export default coordsUpdate;