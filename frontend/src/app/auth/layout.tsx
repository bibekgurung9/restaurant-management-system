"use client";
import Image from "next/image";
import React from "react";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen max-h-screen w-full bg-white">
			<div className="hidden h-screen lg:w-[40%] relative overflow-hidden bg-primary lg:block">
				<div className="absolute top-10 text-white left-10 flex gap-2">
					<Image
						src={"/assets/restro_logo.jpg"}
						alt="RMS"
						height={50}
						width={50}
					/>
					<span className="text-lg font-semibold">Admin - Restaurant MS</span>
				</div>
			</div>
			<div className="flex flex-col w-full justify-center overflow-y-auto items-center py-12 lg:w-[60%]">
				<div className="w-3/5">{children}</div>
			</div>
		</div>
	);
}
