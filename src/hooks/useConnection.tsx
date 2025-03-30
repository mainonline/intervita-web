"use client"

import { useCloud } from "@/cloud/useCloud";
import React, { createContext, useState } from "react";
import { useCallback } from "react";
import { useConfig } from "./useConfig";
import { useToast } from "@/components/toast/ToasterProvider";

export type ConnectionMode = "cloud" | "manual" | "env"

type TokenGeneratorData = {
  shouldConnect: boolean;
  wsUrl: string;
  token: string;
  mode: ConnectionMode;
  disconnect: () => Promise<void>;
  connect: (mode: ConnectionMode, resumeData?: any) => Promise<void>;
};

const ConnectionContext = createContext<TokenGeneratorData | undefined>(undefined);

export const ConnectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { generateToken, wsUrl: cloudWSUrl } = useCloud();
  const { setToastMessage } = useToast();
  const { config } = useConfig();
  const [connectionDetails, setConnectionDetails] = useState<{
    wsUrl: string;
    token: string;
    mode: ConnectionMode;
    shouldConnect: boolean;
    metadata: any;
  }>({ wsUrl: "", token: "", shouldConnect: false, mode: "manual", metadata: {} });

  const connect = useCallback(
    async (mode: ConnectionMode, resumeData?: any) => {
      let token = "";
      let url = "";
      if (mode === "cloud") {
        try {
          token = await generateToken();
          console.log("token generated >>>>>", token);
        } catch (error) {
          setToastMessage({
            type: "error",
            message:
              "Failed to generate token, you may need to increase your role in this LiveKit Cloud project.",
          });
        }
        url = cloudWSUrl;
      } else if (mode === "env") {
        if (!process.env.NEXT_PUBLIC_LIVEKIT_URL) {
          throw new Error("NEXT_PUBLIC_LIVEKIT_URL is not set");
        }
        url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        
        // Prepare request data
        const requestData = {
          roomName: config.settings.room_name || undefined,
          participantName: config.settings.participant_name || undefined,
        };
        
        // If resume data is available, use POST method
        if (resumeData) {
          // Add resume data to request
          const postData = {
            ...requestData,
            resumeData: resumeData
          };
          
          // Make POST request with resume data in body
          const { accessToken } = await fetch('/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
          }).then(res => {
            if (!res.ok) {
              throw new Error('Failed to generate token');
            }
            return res.json();
          });
          
          token = accessToken;
        } else {
          // If no resume data, use GET method with query params
          const params = new URLSearchParams();
          if (requestData.roomName) {
            params.append('roomName', requestData.roomName);
          }
          if (requestData.participantName) {
            params.append('participantName', requestData.participantName);
          }
          
          const { accessToken } = await fetch(`/api/token?${params}`).then((res) =>
            res.json()
          );
          token = accessToken;
        }
      } else {
        token = config.settings.token;
        url = config.settings.ws_url;
      }
      setConnectionDetails({ 
        wsUrl: url, 
        token, 
        shouldConnect: true, 
        mode, 
        metadata: {
          role: "user",
          metadata: "test"
        } 
      });
    },
    [
      cloudWSUrl,
      config.settings.token,
      config.settings.ws_url,
      config.settings.room_name,
      config.settings.participant_name,
      generateToken,
      setToastMessage,
    ]
  );

  const disconnect = useCallback(async () => {
    setConnectionDetails((prev) => ({ ...prev, shouldConnect: false }));
  }, []);

  return (
    <ConnectionContext.Provider
      value={{
        wsUrl: connectionDetails.wsUrl,
        token: connectionDetails.token,
        shouldConnect: connectionDetails.shouldConnect,
        mode: connectionDetails.mode,
        connect,
        disconnect,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = React.useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
}