import { toast } from "sonner";

export function showToast(
	res: {
		status: boolean;
		message: string;
		data: any;
	},
	toastId?: any
) {
	if (res.status) {
		toast.success(res.message, { id: toastId });
	} else {
		toast.error(res.message, { id: toastId });
	}
}
