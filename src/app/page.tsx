import { Header } from "@/components/Header";
import { StudioApp } from "@/components/StudioApp";

export default function Home() {
  return (
    <>
      <Header />
      <StudioApp />
      <footer className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-zinc-500">
        Built with{" "}
        <a
          href="https://platform.xiaomimimo.com"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-300 hover:text-white"
        >
          Xiaomi MiMo
        </a>{" "}
        · MiMo-V2-Omni (vision) · MiMo-V2-Pro (code) · MiMo-V2-TTS (narration)
      </footer>
    </>
  );
}
