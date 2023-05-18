import type { RequestEvent } from "@sveltejs/kit";
import { OPEN_AI_API_KEY, INTERNAL_API_KEY, MEDIA_MANAGER_API_KEY } from "$env/static/private";
import { client, getMessageData, type Message } from "$lib/chatgpt";
import { getAssetDetails, search, type AppContext, getShowAssets } from "$lib/pbs";

interface ChatRequestBody {
  messages: Message[];
  context: AppContext;
}

export async function POST(event: RequestEvent) {
  try {
    const { messages, context = { watchHistory: [] } }: ChatRequestBody = await event.request.json();
    let responseMessage = await client(messages, OPEN_AI_API_KEY);

    console.log("MESSAGE:", responseMessage);
    const messageData = getMessageData(responseMessage)!;
    const { context: chatContext } = messageData;
    console.log("CHAT CONTEXT:", chatContext);
    console.log("APP CONTEXT:", context);
    if (chatContext?.topic && chatContext?.intent === "get-topic-asset") {
      console.log("Looking up new video");
      const { topic } = chatContext;
      const searchResults = await search(topic, INTERNAL_API_KEY);
      if (searchResults.length) {
        const video = searchResults.find((r) => !context.watchHistory.includes(r.cid))!;
        console.log(video.cid, video.slug);
        const assetDetails = await getAssetDetails(video.cid, MEDIA_MANAGER_API_KEY);
        responseMessage.content = JSON.stringify({
          ...messageData,
          message: `I've found this video for you watch. ${video.title}: ${video.description_long}`,
          widget: {
            type: "video",
            data: {
              videoId: video.legacy_tp_media_id,
              title: video.title,
            },
          },
        });
        context.asset = assetDetails;
        context.watchHistory.push(video.cid);
      } else {
        responseMessage.content = JSON.stringify({
          ...messageData,
          message: "I'm sorry, I can't find any videos about that. Please, try a different topic.",
        });
      }
    } else if (context.asset?.show?.cid && chatContext?.intent === "get-show-asset") {
      console.log("This is where we lookup the show");
      const assets = await getShowAssets(context.asset.show.cid, MEDIA_MANAGER_API_KEY);
      if (assets) {
        const asset = assets.find((a) => !context.watchHistory.includes(a.cid))!;
        responseMessage.content = JSON.stringify({
          ...messageData,
          message: `Here is another video from the same show. ${asset.episode.title}: ${asset.description}`,
          widget: {
            type: "video",
            data: {
              videoId: asset.legacyId,
              title: asset.episode.title,
            },
          },
        });
        context.asset = asset;
        context.watchHistory.push(asset.cid);
      } else {
        responseMessage.content = JSON.stringify({
          ...messageData,
          message: "I'm sorry, I can't find any more videos for this show",
        });
      }
    }

    const responseBody = {
      message: responseMessage,
      context,
    };

    const resp = new Response(JSON.stringify(responseBody), {
      headers: { "Content-Type": "application/json" },
    });
    return resp;
  } catch (e: any) {
    console.log(e);
    return new Response(JSON.stringify({ error: e?.toString?.() }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
