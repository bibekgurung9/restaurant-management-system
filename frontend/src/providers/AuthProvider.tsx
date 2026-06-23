"use client";

import { User } from "@/typings";
import React from "react";

export const SessionContext = React.createContext({} as User);

export default function AuthProvider({
	children,
	session,
}: {
	children: React.ReactNode;
	session: User;
}) {
	return (
		<SessionContext.Provider value={session}>
			{children}
		</SessionContext.Provider>
	);
}
