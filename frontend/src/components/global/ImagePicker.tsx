"use client";
import { UploadCloudIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function ImagePicker({
	image,
	setImage,
}: {
	image: any;
	setImage: Function;
}) {
	const [preview, setPreview] = useState(image);

	function handleImage(e: any) {
		setImage(e.target.files[0]);
		setPreview(URL?.createObjectURL(e.target.files[0]));
	}

	return (
		<label className="flex flex-col gap-2 w-full">
			<div className="cursor-pointer h-36 p-2 w-full bg-accent rounded-md border-2 border-gray-300 border-dotted flex flex-col gap-1 items-center justify-center">
				{preview && (
					<Image
						width={100}
						height={100}
						src={preview}
						alt="Preview Image"
						className="rounded-sm object-contain border aspect-video"
					></Image>
				)}
				<div className="flex items-center">
					<UploadCloudIcon className="h-5 w-5 text-primary mr-1" />
					<span className="small-text mt-2">
						Choose {preview ? "Another" : "Image"}
					</span>
				</div>
			</div>

			<input
				onChange={handleImage}
				accept="image/*"
				id="dropzone-file"
				type="file"
				className="hidden"
			/>
		</label>
	);
}
