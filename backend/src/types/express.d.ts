// types/express.d.ts
import { Request } from "express";
import User from "../models/User";
import Store from "../models/store";
import Admin from "../models/admin";
import Owner from "../models/owner";
import Staff from "../models/staff";

declare global {
	namespace Express {
		interface Request {
			// user: User;
			// store: Store;
			admin: Admin;
			owner: Owner;
			staff: Staff;
		}
	}
}
