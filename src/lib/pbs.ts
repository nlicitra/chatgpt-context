export interface PBSVideo {
  cid: string;
  slug: string;
  title: string;
  url: string;
  description_short: string;
  description_long: string;
  video_type: string;
  legacy_tp_media_id: number;
}

export interface AppContext {
  asset?: AssetDetails;
  watchHistory: string[];
}

export interface AssetDetails {
  cid: string;
  video_type: string;
  description: string;
  legacyId: number;
  captionsUrl: string;
  show: {
    cid: string;
    title: string;
    seasonCount: number;
  };
  season: {
    cid: string;
    ordinal: number;
  };
  episode: {
    cid: string;
    ordinal: number;
    title: string;
  };
}

interface StreamInfo {
  title: string;
  description: string;
  streamURL: string;
}
export async function search(query: string, apiKey: string) {
  const resp = await fetch(`https://l6o2qhs9vl.execute-api.us-east-1.amazonaws.com/prod/discover/?search=${query}`, {
    headers: {
      "x-api-key": apiKey,
    },
  });
  const data = await resp.json();
  // console.log(resp.status, data);
  if (!resp.ok) {
    throw data;
  }
  return data.results.videoAndWebResults as PBSVideo[];
}

export async function getAssetDetails(cid: string, token: string): Promise<AssetDetails | undefined> {
  const resp = await fetch(`https://media.services.pbs.org/api/v1/assets/${cid}/`, {
    headers: {
      Authorization: `Basic ${token}`,
    },
  });
  const data = await resp.json();
  // console.log(resp.status, data);
  if (!resp.ok) {
    throw data;
  }
  try {
    return extractAssetDetails(data.data);
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

function extractAssetDetails(data: any): AssetDetails {
  const attr = data.attributes;
  const episode = attr.episode || {};
  const season = attr.parent_tree?.attributes?.season || {};
  const show = season?.attributes?.show || attr.parent_tree?.attributes?.show || {};
  return {
    cid: data.id,
    legacyId: attr.legacy_tp_media_id,
    description: attr.description_long,
    video_type: attr.object_type,
    captionsUrl: attr.captions?.find((c: any) => c.profile === "WebVTT")?.url,
    show: {
      cid: show.id,
      title: show.attributes?.title,
      seasonCount: show.attributes?.seasonCount,
    },
    season: {
      cid: season?.id,
      ordinal: season?.attributes?.ordinal,
    },
    episode: {
      cid: episode.id,
      title: episode.attributes?.title,
      ordinal: episode.attributes?.ordinal,
    },
  };
}

export async function getShowAssets(cid: string, token: string): Promise<AssetDetails[] | undefined> {
  const resp = await fetch(`https://media.services.pbs.org/api/v1/assets/?show-id=${cid}`, {
    headers: {
      Authorization: `Basic ${token}`,
    },
  });
  const data = await resp.json();
  // console.log(resp.status, data);
  if (!resp.ok) {
    throw data;
  }
  try {
    return data.data.map(extractAssetDetails);
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

export async function streamLookup(slug: string, apiKey: string) {
  const resp = await fetch(`https://l6o2qhs9vl.execute-api.us-east-1.amazonaws.com/prod/content-stream/?slug=${slug}`, {
    headers: {
      "x-api-key": apiKey,
    },
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw data;
  }
  return data as StreamInfo;
}
