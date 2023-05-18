import type { AppContext } from "./pbs";

export type Role = "system" | "user" | "assistant";

interface Widget {
  type: string;
  data?: any;
}

interface ChatContext {
  topic?: string;
  intent?: string;
  ordinal?: number | "last";
}

export interface ContextualMessage {
  message: string;
  context?: ChatContext;
  widget?: Widget;
}
export interface Message {
  role: Role;
  content: string;
}

type Model = "gpt-3.5" | "gpt-4";
interface APIBody {
  model: Model;
  messages: Message[];
}

interface APIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: {
    message: Message;
    finish_reason: string;
    index: number;
  }[];
}

export async function client(messages: Message[], token: string) {
  const body: APIBody = {
    model: "gpt-4",
    messages,
  };
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json();
    console.log(JSON.stringify(error));
    throw error.message;
  }
  const data: APIResponse = await response.json();
  return data.choices[0]?.message;
}

export interface ChatResponseBody {
  message: Message;
  context: AppContext;
}

export async function getNextMessage(messages: Message[], context: AppContext): Promise<ChatResponseBody> {
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, context }),
  });
  if (!resp.ok) {
    throw await resp.json();
  }
  return resp.json();
}

export function getMessageData(message: Message): ContextualMessage | null {
  try {
    return JSON.parse(message.content);
  } catch {
    return null;
  }
}

export const SYSTEM_PROMPT: Message = {
  role: "system",
  content: `
    Your main goal is to find PBS content that the user will find enjoyable.
    In order to do this, you will act as a proxy between the user and a web application.
    Your role is to communicate with the user and when necessary, serialize the users intentions and preferences into a JSON object, known as the "context".
    EVERY RESPONSE YOU GIVE MUST BE IN THE FOLLOWING JSON FORMAT: {"message": <response to user>, "context": <context>}
    Respond to initial greetings by explaining who you are and asking the user what topic they are interested in.
    Any topic is valid. A topic can be a broad concept or a specific person, place, or thing.
    You can only recommend video content.
    If you do not know something, DO NOT MAKE ANYTHING UP, say you don't know.
    Sometimes a "widget" property will be manually added to your responses but they SHOULD NOT BE REMEMBERED across messages.

    The following strings should be added to the context under the "intent" key:
    Whenever a topic is being discussed, save the topic in the "topic" key on the context.
    "get-topic-asset": When a user expresses interest in WATCHING content about a particular topic, not just speaking about it, or wants to see another video with the same topic.
    "get-show-asset": When the user is viewing an asset and wants to see other content from the show.
    "get-ordinal-asset": When the user indicates a specific content by its ordinal position. For example, "play the second episode of this season". Also add the ordinal number to the "ordinal" property of the context.
    `,
};
