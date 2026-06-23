import Image from "next/image";

function Loading() {
	return (
		<div className="h-screen w-full flex justify-center items-center text-4xl">
			<BrandLoading />
		</div>
	);
}

export function BrandLoading() {
	return (
		<div className="flex gap-2 items-center animate-pulse">
			<Image
				src={"/assets/restro_logo.jpg"}
				alt="RMS"
				height={75}
				width={75}
        loading="eager"
			/>
			<div className="flex flex-col mt-2">
				<span className="text-2xl font-bold">Restaurant</span>
				<span className="small-text">Management System</span>
			</div>
		</div>
	);
}
export default Loading;
