import { FindProfileProvider } from "./_components/FindProfileProvider";

export default function FindLayout({ children }: { children: React.ReactNode }) {
  return <FindProfileProvider>{children}</FindProfileProvider>;
}
