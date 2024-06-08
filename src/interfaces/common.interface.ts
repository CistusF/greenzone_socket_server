import z from "zod";
import { EventObject } from "./interfaces";

export const chatInfo = z.object({
    to: z.string().nullable(),
    message: z.string()
});
export type chatType = z.infer<typeof chatInfo>;

export type commonEventObject = EventObject<chatType>;