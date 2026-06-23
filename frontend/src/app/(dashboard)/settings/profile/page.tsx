
import { getMyProfileUrl } from "@/config/urls";
import requests from "@/lib/requests";
import ProfileCard from "../_components/ProfileCard";

export const metadata = {
  title: "My Profile",
};

export default async function Page() {
  const { data: user }  = await requests.get(getMyProfileUrl);

  return <ProfileCard user={user} />;
}