import { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  linkText?: string;
  linkHref?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  linkText,
  linkHref
}: StatCardProps) {
  return (
    <Card className="bg-white overflow-hidden shadow">
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            <div className={`${iconColor} text-xl`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {linkText && linkHref && (
        <CardFooter className="bg-gray-50 px-4 py-2">
          <a href={linkHref} className="text-sm text-primary-600 hover:text-primary-800">
            {linkText}
          </a>
        </CardFooter>
      )}
    </Card>
  );
}
