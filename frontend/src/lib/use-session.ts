import { SessionContext } from "@/providers/AuthProvider";
import { useContext } from "react";

export function useSession() {
  return useContext(SessionContext);
}