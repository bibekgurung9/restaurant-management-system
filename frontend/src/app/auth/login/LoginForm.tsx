"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { adminLogin, setRefreshCookie, setSessionCookie } from "@/server-actions/auth.actions";
import { showToast } from "@/lib/requests/showToast";
import { useRouter } from "next/navigation";

function LoginForm() {
  const { replace } = useRouter();

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const res = await adminLogin(formData);

    if (res.status) {
      if (res.data.emailVerified) {
        await setSessionCookie(res.data.accessToken);
        await setRefreshCookie(res.data.refreshToken);
      } else {
        const emailInBase64 = Buffer.from(res.data.email, "utf-8").toString(
          "base64"
        );
        return replace("/auth/verify-email?email=" + emailInBase64);
      }

      return (window.location.href = "/");
    }

    showToast(res);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-6">
      <div>
        <Label>Email</Label>
        <Input required type="text" name="email"></Input>
      </div>
      <div>
        <Label>Password</Label>
        <Input required type="password" name="password"></Input>
      </div>
      <SubmitButton
        pendingText="Logging in..."
        type="submit"
        className="primary-btn mt-5"
      >
        Login
      </SubmitButton>
    </form>
  );
}

export default LoginForm;

