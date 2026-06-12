import { Link2Icon, LogOutIcon } from "lucide-react";
import Drawing from "./_components/Drawing";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup } from "~/components/ui/avatar";

export default async function Home() {
  return (
    <main>
			<div className="flex flex-col items-center">
				<p className="text-2xl font-bold pt-4">Drawing Demo</p>
				<Drawing />
				<div className="flex flex-col w-1/2">
					<div className="flex flex-row gap-2 items-center justify-items-start">
						<p className="text-xl font-bold">My Board</p>
						<p className="font-light text-accent-foreground">{"2/10"}</p>
						<Button><Link2Icon /> Share</Button>
						<Button variant="destructive"><LogOutIcon /> Leave</Button>
						
					</div>
					<AvatarGroup>
						<Avatar>
							<AvatarFallback>EW</AvatarFallback>
							<AvatarBadge className="bg-green-500" />
						</Avatar>
						<Avatar>
							<AvatarFallback>JD</AvatarFallback>
							<AvatarBadge className="bg-red-500" />
						</Avatar>
					</AvatarGroup>
				</div>
				<div className="pt-16">{"*Room UI is placeholder only and no functionality is implemented. Coming soon."}</div>
      </div>
    </main>
  );
}
