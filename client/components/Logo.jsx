"use client";
import Link from "next/link";

export default function Logo(){
    return (
        <Link href="/" className="flex items-center gap-1 font-extrabold text-2xl">
            <span>Elevate</span>
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600 text-white">U</span>
        </Link>
    );
}
