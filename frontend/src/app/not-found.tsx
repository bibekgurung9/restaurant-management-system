import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function NotFound() {
	return (
		<section className="flex flex-col justify-center items-center bg-white h-screen w-full ">
			<h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary ">
				404
			</h1>
			<p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl ">
				{`Something's missing.`}
			</p>
			<p className="mb-4 text-lg font-light text-gray-500 ">
				{`Sorry, we can't find this page.`}
			</p>
			<Link
				href={"/"}
				className="inline-flex items-center gap-2 hover:gap-2 hover:shadow-lg bg-primary text-white focus:ring-4 focus:outline-none focus:ring-brand font-medium rounded-lg text-sm px-5 py-2.5 text-center my-4"
			>
				<ArrowLeftIcon className="h-5 w-5 text-white" />
				<span>Go to dashboard</span>
			</Link>
		</section>
	);
}
