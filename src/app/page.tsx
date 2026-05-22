import Drawing from "./_components/Drawing";

export default async function Home() {
  return (
    <main>
			<div className="flex flex-col items-center">
				<p className="text-2xl font-bold pt-4">Drawing Demo</p>
				<Drawing />
      </div>
    </main>
  );
}
