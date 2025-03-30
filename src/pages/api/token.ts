import { NextApiRequest, NextApiResponse } from "next";
import { generateRandomAlphanumeric } from "@/lib/util";

import { AccessToken } from "livekit-server-sdk";
import type { AccessTokenOptions, VideoGrant } from "livekit-server-sdk";
import { TokenResult } from "../../lib/types";

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

const createToken = (userInfo: AccessTokenOptions, grant: VideoGrant) => {
  const at = new AccessToken(apiKey, apiSecret, userInfo);
  at.addGrant(grant);
  return at.toJwt();
};

export default async function handleToken(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!apiKey || !apiSecret) {
      res.statusMessage = "Environment variables aren't set up correctly";
      res.status(500).end();
      return;
    }

    // Get room name and participant name from either query params (GET) or body (POST)
    const method = req.method || "GET";
    const isPost = method === "POST";
    
    // Extract params from either query or body based on method
    const params = isPost ? req.body : req.query;
    
    // Get room name or generate random one
    const roomName = params.roomName || 
      `room-${generateRandomAlphanumeric(4)}-${generateRandomAlphanumeric(4)}`;
    
    // Get participant name or generate random one
    const identity = params.participantName || 
      `identity-${generateRandomAlphanumeric(4)}`;

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };

    // Get resume data from request body if it's a POST request
    const resumeData = isPost && params.resumeData ? 
      JSON.stringify(params.resumeData) : 
      null;
      
    // If no resume data is provided, return an error
    if (!resumeData) {
      res.status(400).json({ error: "Resume data is required" });
      return;
    }

    const token = await createToken({ identity, metadata: resumeData }, grant);

    const result: TokenResult = {
      identity,
      accessToken: token,
    };

    console.log("Token generated for:", identity);
    console.log("Room name:", roomName);

    res.status(200).json(result);
  } catch (e) {
    res.statusMessage = (e as Error).message;
    res.status(500).end();
  }
}