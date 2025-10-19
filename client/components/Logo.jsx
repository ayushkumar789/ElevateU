// client/components/Logo.jsx
"use client";

export default function Logo({ className = "h-6 w-auto" }) {
    return (
        <div className={`flex items-center gap-1 font-extrabold text-2xl ${className}`}>
            <span>Elevate</span>
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600 text-white">U</span>
        </div>
    );
}
