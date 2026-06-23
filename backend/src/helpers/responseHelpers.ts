import { Response } from "express";

// Common function for sending success responses
const successResponse = (
	res: Response,
	message: string,
	data: any = {},
	meta: any = {}
): void => {
	res.status(200).json({
		status: true,
		message,
		data,
		meta,
		statusCode: 200,
	});
};

// Common function for sending failure responses
const failureResponse = (
	res: Response,
	message: string,
	statusCode: number
): void => {
	res.status(statusCode).json({
		status: false,
		message,
		statusCode,
	});
};

//generate random string
const randomString = (
	length: number = 6,
	characters: string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
): string => {
	let result = "";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charactersLength);
		result += characters.charAt(randomIndex);
	}
	return result;
};

const generateUniqueOTP = async (
	length: number = 6,
	storeModel: any
): Promise<string> => {
	const characters = "0123456789";

	while (true) {
		let result = "";
		const charactersLength = characters.length;

		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * charactersLength);
			result += characters.charAt(randomIndex);
		}

		// Check if the generated OTP already exists in the store model
		const existingStore = await storeModel.findOne({
			where: { otp: result },
		});

		if (!existingStore) {
			// No matching store with the generated OTP found, it's unique
			return result;
		}
		// If a store with the generated OTP already exists, generate a new one and continue the loop.
	}
};

export { successResponse, failureResponse, randomString, generateUniqueOTP };
