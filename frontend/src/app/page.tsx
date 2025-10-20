import { MainWorkspace } from '@/components/MainWorkspace';
import { Sidebar } from '@/components/Sidebar';
import { WindowChrome } from '@/components/WindowChrome';

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 pt-10">
      <WindowChrome />
      <div className="flex flex-1 gap-10">
        <Sidebar />
        <div className="flex flex-1 flex-col items-center pr-8">
          <MainWorkspace />
        </div>
      </div>
    </div>
  );
}
