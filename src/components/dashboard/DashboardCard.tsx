"use client";

import Link from "next/link";

type Props = {
  title: string;
  value: number | string;
  href: string;
  icon?: React.ReactNode;
};

export default function DashboardCard({ title, value, href, icon }: Props) {
  return (
    <Link
      href={href}
      className="block bg-white shadow-md rounded-lg p-5 hover:shadow-lg transition cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {icon && <div className="text-gray-400 text-3xl">{icon}</div>}
      </div>
    </Link>
  );
}

