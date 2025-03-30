import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Inter } from "next/font/google";
import Head from "next/head";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { PlaygroundConnect } from "@/components/PlaygroundConnect";
import Playground from "@/components/playground/Playground";
import { PlaygroundToast, ToastType } from "@/components/toast/PlaygroundToast";
import { ConfigProvider, useConfig } from "@/hooks/useConfig";
import {
  ConnectionMode,
  ConnectionProvider,
  useConnection,
} from "@/hooks/useConnection";
import { useMemo } from "react";
import { ToastProvider, useToast } from "@/components/toast/ToasterProvider";
import { ResumeUpload } from "@/components/ResumeUpload";

const themeColors = [
  "cyan",
  "green",
  "amber",
  "blue",
  "violet",
  "rose",
  "pink",
  "teal",
];

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <ToastProvider>
      <ConfigProvider>
        <ConnectionProvider>
          <Head>
            <title>Intervita AI</title>
            <meta name="description" content="Intervita AI - Your AI-powered interview preparation assistant. Practice with realistic mock interviews, get instant feedback, and improve your skills with personalized AI coaching. Boost your confidence and ace your next job interview!" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
            />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta
              name="apple-mobile-web-app-status-bar-style"
              content="black"
            />
            <meta
              property="og:image"
              content="/intervita-og.png"
            />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <main className="relative flex flex-col justify-center px-4 items-center h-full w-full bg-black repeating-square-background">
            <HomeInner />
          </main>
        </ConnectionProvider>
      </ConfigProvider>
    </ToastProvider>
  );
}

export function HomeInner() {
  const { shouldConnect, wsUrl, token, mode, connect, disconnect } = useConnection();
  const { toastMessage, setToastMessage } = useToast();
  const [resumeData, setResumeData] = useState<any>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  const handleConnect = useCallback(
    async (c: boolean, mode: ConnectionMode) => {
      c ? connect(mode, resumeData) : disconnect();
    },
    [connect, disconnect, resumeData]
  );

  const handleResumeProcessed = (data: any) => {
    setResumeData(data);
    setResumeUploaded(true);
  };

  const showPG = useMemo(() => {
    if (process.env.NEXT_PUBLIC_LIVEKIT_URL) {
      return true;
    }
    if (wsUrl) {
      return true;
    }
    return false;
  }, [wsUrl]);

 
  return (
    <>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="left-0 right-0 top-0 absolute z-10"
            initial={{ opacity: 0, translateY: -50 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -50 }}
          >
            <PlaygroundToast />
          </motion.div>
        )}
      </AnimatePresence>

      {!resumeUploaded ? (
        <ResumeUpload onResumeProcessed={handleResumeProcessed} />
      ) : showPG ? (
        <LiveKitRoom
          className="flex flex-col h-full w-full"
          serverUrl={wsUrl}
          token={token}
          connect={shouldConnect}
          onError={(e) => {
            setToastMessage({ message: e.message, type: "error" });
            console.error(e);
          }}
        >
          <Playground
            logo={<Image src="/logo.svg" alt="Intervita AI" width={30} height={30} />}
            themeColors={themeColors}
            onConnect={(c) => {
              const m = process.env.NEXT_PUBLIC_LIVEKIT_URL ? "env" : mode;
              handleConnect(c, m);
            }}
          />
          <RoomAudioRenderer />
          <StartAudio label="Click to enable audio playback" />
        </LiveKitRoom>
      ) : (
        <PlaygroundConnect
          accentColor={themeColors[1] || "green"}
          onConnectClicked={(mode) => {
            handleConnect(true, mode);
          }}
        />
      )}
    </>
  );
}
