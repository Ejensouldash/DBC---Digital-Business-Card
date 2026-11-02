import { MotionProvider } from "@/components/shared/motion-provider";
import { Reveal } from "@/components/shared/reveal";

// Templates remount on every navigation, so each page fades in as you move between tabs.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <Reveal>{children}</Reveal>
    </MotionProvider>
  );
}
