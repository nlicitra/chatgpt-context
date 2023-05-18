<script lang="ts">
  import { getNextMessage, SYSTEM_PROMPT, type Message, getMessageData } from "$lib/chatgpt";
  import type { AppContext } from "$lib/pbs";

  let chatContext: any = {};
  let appContext: AppContext = {
    watchHistory: [],
  };
  let messages: Message[] = [SYSTEM_PROMPT];
  $: chatMessages = messages.filter(({ role }) => role !== "system");
  let chatElem: HTMLDivElement;

  function addToMessages(message: Message) {
    messages = [...messages, message];
    setTimeout(() => {
      chatElem.scroll({ top: chatElem.scrollHeight });
    }, 100);
  }

  let submitting = false;
  async function onSubmit(event: SubmitEvent) {
    if (submitting) return;
    submitting = true;
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const prompt = data.get("prompt")?.toString();
    if (prompt) {
      addToMessages({
        role: "user",
        content: prompt,
      });
    }
    form.reset();
    try {
      const { message, context } = await getNextMessage(messages, appContext);
      chatContext = getMessageData(message)?.context || {};
      appContext = context;
      addToMessages(message);
    } catch (e) {
      alert(e);
      messages.pop();
      messages = messages; // trigger rerender
    } finally {
      submitting = false;
    }
  }

  function getMessageText(message: Message) {
    return getMessageData(message)?.message || message.content;
  }
</script>

<main>
  <div class="chat" bind:this={chatElem}>
    <div class="message-log">
      {#each chatMessages as message}
        <div class={`message ${message.role}`}>
          <div>{getMessageText(message)}</div>
        </div>
        {#if getMessageData(message)?.widget?.type === "video"}
          <div>
            <div class="video-title">{getMessageData(message)?.widget?.data?.title}</div>
            <iframe
              src={`https://player.pbs.org/portalplayer/${getMessageData(message)?.widget?.data?.videoId}/`}
              title={getMessageData(message)?.widget?.data?.title}
            />
          </div>
        {/if}
      {/each}
      {#if submitting}
        <div class="loading">
          <span>.</span>
          <span style="animation-delay: 100ms">.</span>
          <span style="animation-delay: 200ms">.</span>
        </div>
      {/if}
    </div>
    <form class="prompt-input" on:submit={onSubmit}>
      <input name="prompt" type="text" />
      <button type="submit" disabled={submitting}>Submit</button>
    </form>
  </div>
  <div class="context">
    <pre>{JSON.stringify(chatContext, null, 2)}</pre>
    <pre>{JSON.stringify(appContext, null, 2)}</pre>
  </div>
</main>

<style>
  iframe {
    aspect-ratio: 16 / 9;
    width: 100%;
    border: none;
  }
  main {
    display: flex;
    margin: auto;
    gap: 2rem;
    max-height: 95vh;
    min-height: 95vh;
  }
  pre {
    margin: 0;
    padding: 0.5rem;
    border: 1px solid;
  }
  .video-title {
    font-weight: 700;
    background-color: lightgray;
  }
  .context {
    width: 100%;
    max-width: 50%;
    overflow: scroll;
  }
  .chat {
    background-color: dimgrey;
    width: 100%;
    max-width: 600px;
    box-sizing: border-box;
    overflow-y: scroll;
    display: grid;
    grid-template-rows: 1fr auto;
  }
  .message-log {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    border: 1px solid black;
  }
  .message {
    display: inline-block;
    display: flex;
    flex-direction: column;
    max-width: 75%;
    padding: 0.5rem;
    box-sizing: border-box;
    border-radius: 0.2rem;
    height: fit-content;
  }
  .assistant {
    background-color: darkseagreen;
  }
  .user {
    margin-left: auto;
    background-color: powderblue;
  }
  .loading {
    justify-self: center;
    font-size: 3rem;
    display: flex;
    width: fit-content;
    margin: 0 auto;
  }
  .loading span {
    padding: 0;
    margin: 0;
    position: relative;
    animation: 0.3s infinite alternate wave;
    animation-timing-function: linear;
  }

  @keyframes wave {
    from {
      top: -5px;
      color: black;
    }
    to {
      top: 5px;
      color: white;
    }
  }
  form {
    display: flex;
  }
  input[type="text"] {
    box-sizing: border-box;
    width: 100%;
    height: 2rem;
  }
</style>
